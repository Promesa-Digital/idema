import type { WhatsAppRep } from '../types'

export const whatsappReps: WhatsAppRep[] = [
  { name: 'GERALDINE', phone: '51961768262', probability: 0.25 },
  { name: 'GIMENA', phone: '51997185822', probability: 0.25 },
  { name: 'RODOLFO', phone: '51969360623', probability: 0.25 },
  { name: 'TATIANA', phone: '51991317346', probability: 0.25 },
]

const ASSIGNED_REP_STORAGE_KEY = 'idema_assigned_whatsapp_rep'
let assignedRep: WhatsAppRep | null = null

export function selectWhatsAppRep(): WhatsAppRep {
  const rand = Math.random()
  let cumulative = 0
  for (const rep of whatsappReps) {
    cumulative += rep.probability
    if (rand <= cumulative) return rep
  }
  return whatsappReps[whatsappReps.length - 1]
}

function getNextWhatsAppRep(previousPhone?: string | null): WhatsAppRep {
  if (!previousPhone) {
    return selectWhatsAppRep()
  }

  const currentIndex = whatsappReps.findIndex(rep => rep.phone === previousPhone)
  if (currentIndex === -1) {
    return selectWhatsAppRep()
  }

  return whatsappReps[(currentIndex + 1) % whatsappReps.length]
}

export function getAssignedWhatsAppRep(): WhatsAppRep {
  if (assignedRep) return assignedRep

  if (typeof window !== 'undefined') {
    const savedPhone = window.sessionStorage.getItem(ASSIGNED_REP_STORAGE_KEY)
    assignedRep = getNextWhatsAppRep(savedPhone)
    window.sessionStorage.setItem(ASSIGNED_REP_STORAGE_KEY, assignedRep.phone)
    return assignedRep
  }

  assignedRep = selectWhatsAppRep()

  return assignedRep
}

// Orden explícito de rotación para auxiliares/especializaciones: cada programa consecutivo
// recibe un vendedor distinto (solo se repite al dar la vuelta cada 4 programas).
const PROGRAM_ROTATION_ORDER = [
  'auxiliares-veterinaria',
  'auxiliares-farmacia',
  'auxiliares-agronomia',
  'especializaciones-veterinaria',
  'especializaciones-farmacia',
  'especializaciones-agronomia',
  'especializaciones-psicologia',
]

export function getWhatsAppRepForProgram(category: string, slug: string): WhatsAppRep {
  const key = `${category}-${slug}`
  const index = PROGRAM_ROTATION_ORDER.indexOf(key)
  if (index !== -1) return whatsappReps[index % whatsappReps.length]

  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return whatsappReps[hash % whatsappReps.length]
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
