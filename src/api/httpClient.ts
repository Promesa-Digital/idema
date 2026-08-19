import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from './tokenStorage'
import { emitAuthLogout } from './authEvents'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export const httpClient = axios.create({ baseURL })

/** Plain instance (no interceptors) used only for the refresh call, to avoid recursive 401 handling. */
const refreshClient = axios.create({ baseURL })

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
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isRefreshCall) {
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
      const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', { refreshToken })
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
      settleSubscribers(null, data.accessToken)
      originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`)
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
