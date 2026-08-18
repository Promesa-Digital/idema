/** Decodes a JWT payload without verifying the signature (verification happens server-side). */
export function decodeJwtPayload<T>(token: string): T | null {
  const payload = token.split('.')[1]
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalized)) as T
  } catch {
    return null
  }
}
