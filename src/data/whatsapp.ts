import type { WhatsAppRep } from '../types'

export const whatsappReps: WhatsAppRep[] = [
  { name: 'ADRIAN', phone: '51991317346', probability: 0.40 },
  { name: 'GERALDINE', phone: '51961768262', probability: 0.15 },
  { name: 'RODOLFO', phone: '51969360623', probability: 0.15 },
  { name: 'MERY', phone: '51997185822', probability: 0.15 },
  { name: 'TATIANA', phone: '51986035468', probability: 0.15 },
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
