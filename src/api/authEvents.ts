export const AUTH_LOGOUT_EVENT = 'auth:logout'

/** Dispatched when a token refresh fails, so the app can react (e.g. redirect to login). */
export function emitAuthLogout(): void {
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT))
}
