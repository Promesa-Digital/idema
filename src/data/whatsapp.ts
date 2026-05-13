import type { WhatsAppRep } from '../types'

export const whatsappReps: WhatsAppRep[] = [
  { name: 'ADRIAN', phone: '51991317346', probability: 0.40 },
  { name: 'GERALDINE', phone: '51961768262', probability: 0.15 },
  { name: 'RODOLFO', phone: '51969360623', probability: 0.15 },
  { name: 'MERY', phone: '51997185822', probability: 0.15 },
  { name: 'TATIANA', phone: '51986035468', probability: 0.15 },
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

export function getAssignedWhatsAppRep(): WhatsAppRep {
  if (assignedRep) return assignedRep

  if (typeof window !== 'undefined') {
    const savedPhone = window.sessionStorage.getItem(ASSIGNED_REP_STORAGE_KEY)
    const savedRep = whatsappReps.find(rep => rep.phone === savedPhone)
    if (savedRep) {
      assignedRep = savedRep
      return assignedRep
    }
  }

  assignedRep = selectWhatsAppRep()

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(ASSIGNED_REP_STORAGE_KEY, assignedRep.phone)
  }

  return assignedRep
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
