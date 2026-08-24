import { useState } from 'react'
import FieldError from '../ui/FieldError'
import { createProgramaSchema, updateProgramaSchema, programaCategorias } from '../../schemas/programa'
import type { CreateProgramaValues, UpdateProgramaValues } from '../../schemas/programa'
import { PROGRAMA_CATEGORIA_LABELS } from '../../types/admin'

interface ProgramaFormFields {
  codigo: string; abreviatura: string; nombre: string; tipo: string; categoria: string; malla: string
  descripcion: string; anio: string; num_lecciones: string; certificado: boolean; tutor: string; publicacion_programada: string
}
const emptyFields: ProgramaFormFields = { codigo: '', abreviatura: '', nombre: '', tipo: '', categoria: '', malla: '', descripcion: '', anio: '', num_lecciones: '0', certificado: false, tutor: '', publicacion_programada: '' }
interface ProgramaFormProps { mode: 'create' | 'edit'; initialValues?: Partial<ProgramaFormFields>; onSubmit: (values: CreateProgramaValues | UpdateProgramaValues) => Promise<void>; submitLabel: string; submitError?: string | null }
const inputClass = (error: boolean) => `w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${error ? 'border-red-500' : 'border-[var(--admin-color-border)]'} bg-white text-[var(--admin-color-text-primary)]`
export default function ProgramaForm({ mode, initialValues, onSubmit, submitLabel, submitError }: ProgramaFormProps) {
  const [formData, setFormData] = useState<ProgramaFormFields>({ ...emptyFields, ...initialValues } as ProgramaFormFields)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const change = (name: string, value: string | boolean) => setFormData((previous) => ({ ...previous, [name]: value }))
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const result = (mode === 'create' ? createProgramaSchema : updateProgramaSchema).safeParse({ ...formData, anio: Number(formData.anio), num_lecciones: Number(formData.num_lecciones), tipo: formData.tipo || formData.categoria })
    if (!result.success) { const next: Record<string, string> = {}; result.error.issues.forEach((issue) => { const key = issue.path[0]; if (typeof key === 'string' && !next[key]) next[key] = issue.message }); setErrors(next); return }
    setSaving(true); try { await onSubmit(result.data) } finally { setSaving(false) }
  }
  const fields: Array<[string, string, string]> = [['abreviatura', 'Abreviatura', 'Ej. ENF'], ['nombre', 'Nombre', 'Nombre del programa'], ['malla', 'Malla', 'Ruta o código de malla'], ['anio', 'Año', '2026'], ['num_lecciones', 'Número de lecciones', '0'], ['tutor', 'Tutor', 'Opcional'], ['publicacion_programada', 'Publicación programada', 'AAAA-MM-DDTHH:mm']]
  return <form onSubmit={submit} className="space-y-4" noValidate>
    {submitError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
    {mode === 'create' && <label className="block text-sm font-semibold">Código<input className={inputClass(!!errors.codigo)} value={formData.codigo} onChange={(event) => change('codigo', event.target.value)} placeholder="CAR-001" /> <FieldError id="programa-codigo-error" message={errors.codigo} /></label>}
    {fields.map(([name, label, placeholder]) => <label key={name} className="block text-sm font-semibold">{label}<input type={name === 'anio' || name === 'num_lecciones' ? 'number' : name === 'publicacion_programada' ? 'datetime-local' : 'text'} className={inputClass(!!errors[name])} value={formData[name as keyof ProgramaFormFields] as string} onChange={(event) => change(name, event.target.value)} placeholder={placeholder} /><FieldError id={`programa-${name}-error`} message={errors[name]} /></label>)}
    <label className="block text-sm font-semibold">Tipo<select className={inputClass(!!errors.tipo)} value={formData.tipo} onChange={(event) => change('tipo', event.target.value)}><option value="">Selecciona</option>{programaCategorias.map((value) => <option key={value} value={value}>{PROGRAMA_CATEGORIA_LABELS[value]}</option>)}</select></label>
    <label className="block text-sm font-semibold">Categoría<input className={inputClass(!!errors.categoria)} value={formData.categoria} onChange={(event) => change('categoria', event.target.value)} placeholder="Categoría backend" /></label>
    <label className="block text-sm font-semibold">Descripción<textarea className={inputClass(!!errors.descripcion)} value={formData.descripcion} onChange={(event) => change('descripcion', event.target.value)} rows={3} /></label>
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={formData.certificado} onChange={(event) => change('certificado', event.target.checked)} /> Certificado</label>
    <button disabled={saving} className="w-full rounded-lg bg-[var(--admin-color-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : submitLabel}</button>
  </form>
}
