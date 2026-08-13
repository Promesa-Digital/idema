import { httpClient } from './httpClient'
import type { LoginFormValues } from '../schemas/login'

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', credentials)
  return data
}
