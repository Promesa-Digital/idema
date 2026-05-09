import type { WhatsAppRep } from '../types'

export const whatsappReps: WhatsAppRep[] = [
  { name: 'MERY', phone: '51997185822', probability: 0.20 },
  { name: 'RODOLFO', phone: '51969360623', probability: 0.20 },
  { name: 'TATIANA', phone: '51986035468', probability: 0.20 },
  { name: 'GERALDINE', phone: '51961768262', probability: 0.20 },
  { name: 'ADRIAN', phone: '51991317346', probability: 0.20 },
]

export function selectWhatsAppRep(): WhatsAppRep {
  const rand = Math.random()
  let cumulative = 0
  for (const rep of whatsappReps) {
    cumulative += rep.probability
    if (rand <= cumulative) return rep
  }
  return whatsappReps[whatsappReps.length - 1]
}

export function getWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
