import { useState } from 'react'
import FieldError from '../ui/FieldError'
import { popupSchema, popupTipos } from '../../schemas/popup'
import type { PopupFormValues } from '../../schemas/popup'

interface PopupFormProps { initialValues?: Partial<PopupFormValues>; onSubmit: (values: PopupFormValues) => Promise<void>; submitLabel: string; submitError?: string | null }
const defaults: PopupFormValues = { tipo: 'anuncio', texto: '', imagen_url: '', video_url: '', enlace: '', paginas: '/', fecha_inicio: '', fecha_fin: '', monto_descuento: '', duracion_temporizador: '10', texto_superior: '' }
export default function PopupForm({ initialValues, onSubmit, submitLabel, submitError }: PopupFormProps) {
  const [values, setValues] = useState<PopupFormValues>({ ...defaults, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const change = (name: keyof PopupFormValues, value: string) => setValues((previous) => ({ ...previous, [name]: value }))
  const submit = async (event: React.FormEvent) => { event.preventDefault(); const result = popupSchema.safeParse(values); if (!result.success) { const next: Record<string, string> = {}; result.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === 'string' && !next[key]) next[key] = issue.message }); setErrors(next); return }; setSaving(true); try { await onSubmit(result.data) } finally { setSaving(false) } }
  return <form onSubmit={submit} className="space-y-4" noValidate>
    {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
    <label className="block text-sm font-semibold">Tipo<select className="w-full rounded-lg border p-2.5" value={values.tipo} onChange={(event) => change('tipo', event.target.value)}>{popupTipos.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
    {([['texto', 'Texto'], ['imagen_url', 'Imagen URL'], ['video_url', 'Video URL'], ['enlace', 'Enlace'], ['paginas', 'Páginas'], ['fecha_inicio', 'Fecha de inicio'], ['fecha_fin', 'Fecha de fin']] as const).map(([name, label]) => <label key={name} className="block text-sm font-semibold">{label}<input type={name.startsWith('fecha_') ? 'date' : 'text'} className="w-full rounded-lg border p-2.5" value={values[name]} onChange={(event) => change(name, event.target.value)} /><FieldError id={`popup-${name}-error`} message={errors[name]} /></label>)}
    {values.tipo === 'descuento' && ([['texto_superior', 'Texto superior', 'text'], ['monto_descuento', 'Monto del descuento (S/)', 'number'], ['duracion_temporizador', 'Duración del temporizador (min)', 'number']] as const).map(([name, label, type]) => <label key={name} className="block text-sm font-semibold">{label}<input type={type} className="w-full rounded-lg border p-2.5" value={values[name]} onChange={(event) => change(name, event.target.value)} /><FieldError id={`popup-${name}-error`} message={errors[name]} /></label>)}
    <button disabled={saving} className="w-full rounded-lg bg-[var(--admin-color-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : submitLabel}</button>
  </form>
}
