import { API_BASE_URL } from '@/services/apiClient'

export type SystemConnectionStatus = 'checking' | 'online' | 'backend_offline' | 'database_offline'

export interface SystemStatus {
  status: SystemConnectionStatus
  label: string
}

async function fetchWithTimeout(path: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 5000)

  try {
    return await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function checkSystemStatus(): Promise<SystemStatus> {
  try {
    const apiResponse = await fetchWithTimeout('/api/v1/health')
    if (!apiResponse.ok) return { status: 'backend_offline', label: 'API no disponible' }
  } catch {
    return { status: 'backend_offline', label: 'Backend desconectado' }
  }

  try {
    const readinessResponse = await fetchWithTimeout('/api/v1/health/readiness')
    if (!readinessResponse.ok) {
      return { status: 'database_offline', label: 'Base de datos desconectada' }
    }
    return { status: 'online', label: 'Sistema conectado' }
  } catch {
    return { status: 'database_offline', label: 'Base de datos desconectada' }
  }
}
