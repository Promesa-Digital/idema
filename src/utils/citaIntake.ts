const ENDPOINT =
  (import.meta.env.VITE_CITA_ENDPOINT as string | undefined) ??
  (import.meta.env.DEV ? '/api/cita' : 'https://bienestar.idema.edu.pe/api/cita')

const MENSAJE_MAX_LENGTH = 300
const RATELIMIT_ERROR_MESSAGE =
  'Recibimos varias solicitudes desde tu conexión. Espera unos minutos o escríbenos por WhatsApp.'
const SERVER_ERROR_MESSAGE = 'Ocurrió un error. Por favor intenta de nuevo o contáctanos directamente por WhatsApp.'
const NETWORK_ERROR_MESSAGE = 'No pudimos conectarnos. Verifica tu conexión e intenta de nuevo.'

export interface CitaPayload {
  nombreCompleto: string
  email: string
  telefono: string
  servicioSlug: string
  servicio: string
  mensaje?: string
  consentimiento: boolean
  origen: string
  website: string // honeypot
}

export interface CitaResult {
  ok: boolean
  status: number // 0 = network failure
  reason?: 'validation' | 'ratelimit' | 'server' | 'network'
  error?: string // Spanish, ready for the UI
}

function normalizePayload(p: CitaPayload): CitaPayload {
  return {
    nombreCompleto: p.nombreCompleto.trim(),
    email: p.email.trim().toLowerCase(),
    telefono: p.telefono.replace(/\D/g, '').slice(-9),
    servicioSlug: p.servicioSlug,
    servicio: p.servicio,
    mensaje: (p.mensaje ?? '').trim().slice(0, MENSAJE_MAX_LENGTH),
    consentimiento: p.consentimiento,
    origen: window.location.hostname,
    website: p.website,
  }
}

export async function submitCita(input: CitaPayload): Promise<CitaResult> {
  const payload = normalizePayload(input)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.status === 200) {
      return { ok: true, status: 200 }
    }

    if (res.status === 400) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      return { ok: false, status: 400, reason: 'validation', error: data.error || SERVER_ERROR_MESSAGE }
    }

    if (res.status === 429) {
      return { ok: false, status: 429, reason: 'ratelimit', error: RATELIMIT_ERROR_MESSAGE }
    }

    return { ok: false, status: res.status, reason: 'server', error: SERVER_ERROR_MESSAGE }
  } catch {
    return { ok: false, status: 0, reason: 'network', error: NETWORK_ERROR_MESSAGE }
  }
}
