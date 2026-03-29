export interface CampoLaboral {
  title: string
  description: string
}

export interface MallaCurricular {
  year: string
  courses: string[]
}

export interface Carrera {
  slug: string
  title: string
  shortTitle: string
  duration: string
  modality: string
  description: string
  image: string
  category: 'carrera' | 'auxiliar' | 'especializacion' | 'curso'
  features?: string[]
  campoLaboral?: CampoLaboral[]
  mallaCurricular?: MallaCurricular[]
  whatsappMessage?: string
  price?: string
  priceVirtual?: string
  priceSemipresencial?: string
  pricePresencial?: string
  matricula?: string
  requirements?: string[]
  certification?: string[]
  titulacion?: string
  mallaCurricularImage?: string
  subtitle?: string
}

export interface ContactFormData {
  firstName: string
  lastName: string
  countryCode: string
  phone: string
  email: string
  comment: string
  acceptPolicies: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export interface WhatsAppRep {
  name: string
  phone: string
  probability: number
}

export interface Testimonial {
  name: string
  role: string
  text: string
  image?: string
}

export interface CompanyLogo {
  name: string
  image: string
}

export interface FAQItem {
  question: string
  answer: string
  category?: string
}

export interface Noticia {
  slug: string
  title: string
  date: string
  summary: string
  image: string
  externalUrl?: string
}
