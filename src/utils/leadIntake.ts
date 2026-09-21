import { API_BASE_URL } from '@/services/apiClient'

/**
 * Captura de leads del sitio público.
 *
 * Los datos van a nuestro backend (`POST /api/v1/leads/`), que es de donde se alimenta
 * el módulo Leads del panel. Antes salían hacia `/php/lead_intake_proxy.php`, el sistema
 * antiguo, y el panel nunca recibía nada.
 *
 * El reenvío a un CRM es cosa del backend y es opcional: aquí solo se captura.
 */

const ENDPOINT = `${API_BASE_URL}/api/v1/leads/`

/**
 * El sistema antiguo sigue recibiendo copia mientras se mantenga en pie. Es mejor un
 * lead duplicado en dos bandejas que un lead perdido en una migración.
 */
const ENDPOINT_LEGADO = '/php/lead_intake_proxy.php'
const ENVIAR_A_LEGADO = import.meta.env.VITE_LEADS_LEGACY !== 'false'

const RETRY_QUEUE_KEY = 'idema_lead_retry_queue'
const MAX_QUEUE = 20

/** Los dos formularios del sitio. Ambos son captación directa, no un popup. */
export type LeadForm = 1 | 2

export interface LeadPayload {
  firstName: string
  lastName: string
  phone: string
  email: string
  form: LeadForm
  message?: string
  /** El visitante marcó la casilla de política de privacidad. */
  consent?: boolean
}

export interface LeadResult {
  ok: boolean
  status: number
  duplicate?: boolean
  queued?: boolean
  error?: string
  leadCode?: string
}

interface QueueItem {
  payload: LeadPayload
  ts: number
}

function normalizePayload(p: LeadPayload): LeadPayload {
  return {
    firstName: p.firstName.trim().slice(0, 100),
    lastName: p.lastName.trim().slice(0, 100),
    phone: p.phone.replace(/\D/g, '').slice(-9),
    email: p.email.trim().slice(0, 100),
    form: p.form,
    message: (p.message ?? '').trim().slice(0, 5000),
    consent: p.consent !== false,
  }
}

/** Lo que espera `LeadCreate` en el backend. */
interface CuerpoLead {
  nombre: string
  correo: string
  telefono: string
  origen: 'formulario' | 'popup'
  consentimiento: boolean
  mensaje?: string
}

export function aCuerpoLead(p: LeadPayload): CuerpoLead {
  const cuerpo: CuerpoLead = {
    // El backend guarda un solo campo de nombre; el formulario pide dos.
    nombre: `${p.firstName} ${p.lastName}`.trim(),
    correo: p.email,
    telefono: p.phone,
    origen: 'formulario',
    consentimiento: p.consent !== false,
  }
  if (p.message) cuerpo.mensaje = p.message
  return cuerpo
}

/**
 * Saca un texto legible del cuerpo de error.
 *
 * FastAPI devuelve `detail` como cadena en los errores propios, pero como lista de
 * objetos en los de validación (422). Volcarla tal cual dejaba "[object Object]" en
 * pantalla.
 */
async function mensajeDeError(res: Response): Promise<string> {
  const generico = 'No se pudo registrar. Revisa los datos e intenta de nuevo.'
  const cuerpo = (await res.json().catch(() => null)) as {
    detail?: string | Array<{ msg?: string }>
    error?: string
  } | null

  if (!cuerpo) return generico
  if (typeof cuerpo.detail === 'string' && cuerpo.detail.trim()) return cuerpo.detail
  if (Array.isArray(cuerpo.detail)) {
    const mensajes = cuerpo.detail
      .map((item) => item.msg)
      .filter((item): item is string => Boolean(item))
      // Pydantic antepone "Value error, " a los validadores propios; sobra en pantalla.
      .map((msg) => msg.replace(/^Value error,\s*/, ''))
    if (mensajes.length > 0) return mensajes.join('. ')
  }
  if (typeof cuerpo.error === 'string' && cuerpo.error.trim()) return cuerpo.error
  return generico
}

async function postLead(payload: LeadPayload): Promise<Response> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aCuerpoLead(payload)),
  })
}

/** Copia al sistema antiguo. Nunca lanza ni bloquea: si falla, el lead ya está a salvo. */
function postLegado(payload: LeadPayload): void {
  if (!ENVIAR_A_LEGADO) return
  void fetch(ENDPOINT_LEGADO, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* el destino principal es el backend propio; esto es solo una copia */
  })
}

export async function submitLead(input: LeadPayload): Promise<LeadResult> {
  const payload = normalizePayload(input)

  if (payload.phone.length !== 9) {
    return { ok: false, status: 400, error: 'El teléfono debe tener 9 dígitos.' }
  }
  if (!payload.consent) {
    return {
      ok: false,
      status: 400,
      error: 'Acepta la política de privacidad para continuar.',
    }
  }

  try {
    const res = await postLead(payload)

    if (res.status === 201) {
      postLegado(payload)
      void flushRetryQueue()
      const data = await res.json().catch(() => ({}) as { id?: string })
      // El backend identifica el lead por su id; el sistema antiguo devolvía un código.
      return { ok: true, status: 201, leadCode: data.id }
    }

    if (res.status === 409) {
      return {
        ok: false,
        status: 409,
        duplicate: true,
        error: 'Ya estás registrado en nuestro sistema.',
      }
    }

    // El endpoint público está limitado por IP. Reintentar en bucle solo empeora la
    // espera, así que no se encola: se le pide al visitante que espere.
    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        error: 'Recibimos varias solicitudes desde aquí. Espera unos minutos.',
      }
    }

    if (res.status >= 500) {
      enqueue(payload)
      return {
        ok: false,
        status: res.status,
        queued: true,
        error: 'No pudimos contactar al servidor. Guardamos tus datos y reintentaremos.',
      }
    }

    return { ok: false, status: res.status, error: await mensajeDeError(res) }
  } catch {
    enqueue(payload)
    return {
      ok: false,
      status: 0,
      queued: true,
      error: 'Error de conexión. Guardamos tus datos y reintentaremos.',
    }
  }
}

function enqueue(payload: LeadPayload): void {
  try {
    const list = readQueue()
    list.push({ payload, ts: Date.now() })
    writeQueue(list.slice(-MAX_QUEUE))
  } catch {
    /* localStorage no disponible — perdemos el reintento, no rompemos UI */
  }
}

function readQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(RETRY_QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as QueueItem[]) : []
  } catch {
    return []
  }
}

function writeQueue(list: QueueItem[]): void {
  try {
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

export async function flushRetryQueue(): Promise<void> {
  const list = readQueue()
  if (list.length === 0) return

  const remaining: QueueItem[] = []
  for (const item of list) {
    try {
      const res = await postLead(item.payload)
      // 201 guardado, 400 inválido y 409 duplicado no mejoran reintentando. 429 sí:
      // la ventana del limitador se abre sola, así que ese se conserva en la cola.
      if (res.status === 201 || res.status === 400 || res.status === 409) {
        if (res.status === 201) postLegado(item.payload)
        continue
      }
      remaining.push(item)
    } catch {
      remaining.push(item)
    }
  }
  writeQueue(remaining)
}
