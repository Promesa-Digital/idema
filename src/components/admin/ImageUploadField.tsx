import { useId, useState } from 'react'
import type { ChangeEvent } from 'react'
import { subirImagenWebp } from '@/services/uploadsApi'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

async function convertToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / bitmap.width, 1600 / bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo procesar la imagen.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen a WebP.')),
      'image/webp',
      0.82,
    )
  })
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  disabled = false,
}: ImageUploadFieldProps) {
  const id = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setIsUploading(true)
    try {
      const webp = await convertToWebp(file)
      if (webp.size > 5 * 1024 * 1024) throw new Error('La imagen optimizada supera 5 MB.')
      const url = await subirImagenWebp(webp, `${file.name.replace(/\.[^.]+$/, '')}.webp`)
      onChange(url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la imagen.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-dark">{label}</label>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
        {value ? (
          <img src={value} alt="Vista previa" className="h-24 w-32 rounded-lg bg-slate-100 object-cover" />
        ) : (
          <div className="grid h-24 w-32 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">Sin imagen</div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            disabled={disabled || isUploading}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white"
          />
          <input
            type="url"
            value={value.startsWith('http') ? value : ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder="O pega una URL externa"
            disabled={disabled || isUploading}
            className="min-h-10 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-xs text-slate-500">Se redimensiona y convierte automáticamente a WebP.</p>
          {isUploading && <p className="text-xs font-semibold text-primary">Procesando imagen...</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
