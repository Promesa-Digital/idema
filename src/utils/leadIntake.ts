const ENDPOINT = '/php/lead_intake_proxy.php'
const RETRY_QUEUE_KEY = 'idema_lead_retry_queue'
const MAX_QUEUE = 20

export interface LeadPayload {
  firstName: string
  lastName: string
  phone: string
  email: string
  form: 1 | 2
  message?: string
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
  }
}

async function postLead(payload: LeadPayload): Promise<Response> {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function submitLead(input: LeadPayload): Promise<LeadResult> {
  const payload = normalizePayload(input)

  if (payload.phone.length !== 9) {
    return { ok: false, status: 400, error: 'El teléfono debe tener 9 dígitos.' }
  }

  try {
    const res = await postLead(payload)

    if (res.status === 201) {
      const data = await res.json().catch(() => ({} as { leadCode?: string }))
      void flushRetryQueue()
      return { ok: true, status: 201, leadCode: data.leadCode }
    }

    if (res.status === 409) {
      return {
        ok: false,
        status: 409,
        duplicate: true,
        error: 'Ya estás registrado en nuestro sistema.',
      }
    }

    if (res.status >= 500 || res.status === 502) {
      enqueue(payload)
      return {
        ok: false,
        status: res.status,
        queued: true,
        error: 'No pudimos contactar al servidor. Guardamos tus datos y reintentaremos.',
      }
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, status: res.status, error: data.error || 'No se pudo registrar.' }
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
      // 201 ok, 400 inválido (no reintentamos), 409 duplicado (ya está)
      if (res.status === 201 || res.status === 400 || res.status === 409 || res.status === 401) {
        continue
      }
      remaining.push(item)
    } catch {
      remaining.push(item)
    }
  }
  writeQueue(remaining)
}
