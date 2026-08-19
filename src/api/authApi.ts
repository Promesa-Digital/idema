import { httpClient } from './httpClient'
import type { LoginFormValues } from '../schemas/login'

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export async function login(credentials: LoginFormValues): Promise<LoginResponse> {
  const { data } = await httpClient.post<{ access_token: string }>('/auth/login', {
    correo: credentials.email,
    password: credentials.password,
  })
  return { accessToken: data.access_token, refreshToken: data.access_token }
}
