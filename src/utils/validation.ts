interface ValidationResult {
  valid: boolean
  error?: string
  formatted?: string
  suggestion?: string
}

/**
 * Valida un campo de nombre o apellido por separado.
 * Para nombre completo (un solo input), usar validateName.
 */
export function validateNamePart(name: string, field: 'nombre' | 'apellido' = 'nombre'): ValidationResult {
  const c = name.trim()
  if (c.length === 0) return { valid: false, error: `Ingresa tu ${field}.` }
  if (c.length < 2) return { valid: false, error: `Tu ${field} es muy corto.` }
  if (c.length > 50) return { valid: false, error: `Tu ${field} es demasiado largo.` }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(c)) return { valid: false, error: `${field === 'nombre' ? 'El nombre' : 'El apellido'} solo debe contener letras.` }
  return { valid: true, formatted: c }
}

/**
 * Valida nombre completo (nombres y apellidos en un solo input).
 * Para campos separados, usar validateNamePart.
 */
export function validateName(name: string): ValidationResult {
  const c = name.trim()
  if (c.length < 3) return { valid: false, error: 'El nombre debe tener al menos 3 caracteres.' }
  if (c.length > 100) return { valid: false, error: 'El nombre es demasiado largo.' }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(c)) return { valid: false, error: 'El nombre solo debe contener letras.' }
  if (c.split(/\s+/).filter(w => w.length > 0).length < 2) return { valid: false, error: 'Ingresa tu nombre y apellido.' }
  return { valid: true, formatted: c }
}

/**
 * Valida un celular peruano: exactamente 9 dígitos empezando con 9.
 * Es lo que exige el CRM de IDEMA para los leads.
 */
export function validatePhone(phone: string): ValidationResult {
  const c = phone.replace(/\D/g, '')
  if (c.length === 0) return { valid: false, error: 'Ingresa tu teléfono.' }
  if (c.length < 9) return { valid: false, error: `Faltan ${9 - c.length} dígito${9 - c.length === 1 ? '' : 's'}.` }
  if (c.length > 9) return { valid: false, error: 'El teléfono debe tener 9 dígitos.' }
  if (!c.startsWith('9')) return { valid: false, error: 'Debe empezar con 9.' }
  return { valid: true, formatted: c }
}

export function validateEmail(email: string): ValidationResult {
  const c = email.trim().toLowerCase()
  if (c.length === 0) return { valid: false, error: 'El correo es obligatorio.' }
  if (c.length > 100) return { valid: false, error: 'El correo es demasiado largo.' }
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(c)) return { valid: false, error: 'Ingresa un correo válido.' }
  const typos: Record<string, string> = {
    'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gamil.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'hotmal.com': 'hotmail.com',
  }
  const d = c.split('@')[1]
  if (typos[d]) return { valid: false, error: `¿Quisiste decir @${typos[d]}?`, suggestion: c.replace(d, typos[d]) }
  return { valid: true, formatted: c }
}

export function validateComment(comment: string): ValidationResult {
  const c = comment.trim()
  if (c.length === 0) return { valid: false, error: 'Cuéntanos qué te interesa.' }
  if (c.length < 3) return { valid: false, error: 'Sé un poco más específico.' }
  if (c.length > 500) return { valid: false, error: 'Tu mensaje es demasiado largo.' }
  return { valid: true, formatted: c }
}
