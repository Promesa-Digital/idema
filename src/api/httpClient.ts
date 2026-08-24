import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from './tokenStorage'
import { emitAuthLogout } from './authEvents'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  accessToken?: string
  refreshToken?: string
  access_token?: string
}

export const httpClient = axios.create({ baseURL })

/** Plain instance (no interceptors) used only for the refresh call, to avoid recursive 401 handling. */
const refreshClient = axios.create({ baseURL })

/**
 * Si VITE_API_BASE_URL apunta al dev server en lugar del backend, Vite responde
 * el index.html de la SPA con estado 200. Sin esta guarda, axios lo da por bueno
 * y las pantallas se renderizan vacías sin mostrar ningún error.
 */
function rejectNonJsonResponse(response: AxiosResponse): AxiosResponse {
  const contentType = response.headers?.['content-type']
  if (response.status !== 204 && !String(contentType ?? '').includes('application/json')) {
    throw new AxiosError(
      `La API respondió "${contentType ?? 'sin content-type'}" en lugar de JSON. ` +
        `Revisa que VITE_API_BASE_URL apunte al backend (actual: ${baseURL}).`,
      'ERR_NOT_JSON',
      response.config,
      response.request,
      response,
    )
  }
  return response
}

httpClient.interceptors.response.use(rejectNonJsonResponse)
refreshClient.interceptors.response.use(rejectNonJsonResponse)

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

let isRefreshing = false
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = []

function waitForRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshSubscribers.push({ resolve, reject })
  })
}

function settleSubscribers(error: unknown, token?: string) {
  refreshSubscribers.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  refreshSubscribers = []
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const isPublicAuthCall = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isPublicAuthCall) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) {
      tokenStorage.clearTokens()
      emitAuthLogout()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      try {
        const newAccessToken = await waitForRefresh()
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return httpClient(originalRequest)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    isRefreshing = true
    try {
      const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      })
      const nextAccessToken = data.accessToken ?? data.access_token
      if (!nextAccessToken) {
        throw new Error('Token de refresco inválido')
      }
      tokenStorage.setTokens(nextAccessToken, data.refreshToken ?? nextAccessToken)
      settleSubscribers(null, nextAccessToken)
      originalRequest.headers.set('Authorization', `Bearer ${nextAccessToken}`)
      return httpClient(originalRequest)
    } catch (refreshError) {
      settleSubscribers(refreshError)
      tokenStorage.clearTokens()
      emitAuthLogout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
