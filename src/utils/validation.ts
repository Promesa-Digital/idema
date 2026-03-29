interface ValidationResult {
  valid: boolean
  error?: string
  formatted?: string
  suggestion?: string
}

export function validateName(name: string): ValidationResult {
  const c = name.trim()
  if (c.length < 3) return { valid: false, error: 'El nombre debe tener al menos 3 caracteres.' }
  if (c.length > 100) return { valid: false, error: 'El nombre es demasiado largo.' }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(c)) return { valid: false, error: 'El nombre solo debe contener letras.' }
  if (c.split(/\s+/).filter(w => w.length > 0).length < 2) return { valid: false, error: 'Ingresa tu nombre y apellido.' }
  return { valid: true, formatted: c }
}

export function validatePhone(phone: string): ValidationResult {
  let c = phone.replace(/[^0-9]/g, '')
  if (c.length === 0) return { valid: false, error: 'El teléfono es obligatorio.' }
  if (c.length < 6) return { valid: false, error: 'El número debe tener al menos 6 dígitos.' }
  if (c.length > 11) return { valid: false, error: 'El número tiene demasiados dígitos.' }
  if (c.startsWith('51') && c.length === 11) return { valid: true, formatted: c }
  if (c.length === 9 && c.startsWith('9')) return { valid: true, formatted: '51' + c }
  if (c.length >= 6 && c.length <= 7) return { valid: true, formatted: '51' + c }
  if (c.length === 9) return { valid: true, formatted: '51' + c }
  if (!c.startsWith('51')) c = '51' + c
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
  if (c.length === 0) return { valid: false, error: 'Indica tu interés.' }
  if (c.length < 3) return { valid: false, error: 'Sé más específico.' }
  if (c.length > 500) return { valid: false, error: 'Comentario muy largo.' }
  return { valid: true, formatted: c }
}
