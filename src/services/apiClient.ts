export const API_TOKEN_STORAGE_KEY = 'idema_admin_token'

export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000'
).replace(/\/$/, '')

interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string }>
  message?: string
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string | null
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(API_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (!payload || typeof payload !== 'object') return fallback

  const { detail, message } = payload as ApiErrorPayload
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item.msg)
      .filter((item): item is string => Boolean(item))

    if (messages.length > 0) return messages.join('. ')
  }
  if (typeof message === 'string') return message

  return fallback
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token = getStoredToken(), headers: customHeaders, ...requestOptions } = options
  const headers = new Headers(customHeaders)
  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    const message = navigator.onLine
      ? 'El backend no está disponible. Verifica que el servidor esté encendido.'
      : 'No tienes conexión a internet. Revisa tu red e inténtalo nuevamente.'
    throw new ApiError(message, 0, null)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const responseText = response.status === 204 ? '' : await response.text()
  let payload: unknown = responseText

  if (responseText && contentType.includes('application/json')) {
    try {
      payload = JSON.parse(responseText) as unknown
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `La solicitud falló con el estado ${response.status}.`),
      response.status,
      payload,
    )
  }

  return payload as T
}
