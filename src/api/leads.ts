import { httpClient } from './httpClient'
import type { Lead, LeadEstado } from '../types'

const BASE_URL = '/leads'
export async function getLeads(params: { estado?: LeadEstado } = {}): Promise<Lead[]> {
  const { data } = await httpClient.get<Lead[]>(`${BASE_URL}/`, { params })
  return data
}
export async function updateLeadEstado(id: string, estado: LeadEstado): Promise<Lead> {
  const { data } = await httpClient.patch<Lead>(`${BASE_URL}/${id}/estado`, { estado })
  return data
}