import { apiRequest } from '@/services/apiClient'

export async function subirImagenWebp(file: Blob, filename: string): Promise<string> {
  const body = new FormData()
  body.append('imagen', file, filename)
  const response = await apiRequest<{ url: string }>('/api/v1/uploads/imagenes', {
    method: 'POST',
    body,
  })
  return response.url
}
