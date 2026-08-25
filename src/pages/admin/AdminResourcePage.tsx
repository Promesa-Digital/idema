import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPause, FiPlay, FiXCircle } from 'react-icons/fi'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { iconButtonClasses } from '../../components/ui/buttonVariants'
import { useToast } from '../../hooks/useToast'
import { getConceptosCobro, createConceptoCobro, desactivarConceptoCobro, activarConceptoCobro } from '../../api/conceptosCobro'
import { getCombos, createCombo, deleteCombo, activarCombo } from '../../api/combos'
import { getDescuentos, createDescuento, deleteDescuento, activarDescuento } from '../../api/descuentos'
import { getMatriculas, anularMatricula } from '../../api/matriculas'
import { getElectivos } from '../../api/electivos'
import { fetchProgramas } from '../../api/adminProgramasApi'
import FormInput from '../../components/ui/FormInput'
import type { ConceptoCobroTipo, DescuentoTipo } from '../../types'

type Resource = 'conceptos-cobro' | 'combos' | 'descuentos' | 'matriculas' | 'electivos'
type Row = Record<string, unknown> & { id: string; estado?: string }
const titles: Record<Resource, string> = { 'conceptos-cobro': 'Conceptos de cobro', combos: 'Combos', descuentos: 'Descuentos', matriculas: 'Matrículas', electivos: 'Electivos' }
const keys: Record<Resource, string[]> = { 'conceptos-cobro': ['tipo', 'programa_id', 'monto', 'estado'], combos: ['nombre', 'programa_ids', 'vigencia_inicio', 'vigencia_fin', 'estado'], descuentos: ['tipo', 'concepto_id', 'porcentaje', 'estado'], matriculas: ['alumno_id', 'programa_id', 'tipo', 'estado', 'created_at'], electivos: ['matricula_id', 'programa_id', 'estado', 'fecha_activacion'] }
function routeResource(path: string): Resource { return path.split('/').filter(Boolean).at(-1) as Resource }
function label(value: unknown): string { return Array.isArray(value) ? value.join(', ') : value == null ? '—' : String(value) }

async function load(resource: Resource): Promise<Row[]> {
  const loaders: Record<Resource, () => Promise<unknown[]>> = {
    'conceptos-cobro': getConceptosCobro, combos: getCombos, descuentos: () => getDescuentos(),
    matriculas: getMatriculas, electivos: getElectivos,
  }
  return (await loaders[resource]()) as Row[]
}

/**
 * Acción destructiva (baja lógica / anulación / cierre) por recurso. `esTerminal` refleja
 * la misma regla que el backend usa para rechazar la operación (409 si ya se aplicó antes),
 * así el botón se oculta en vez de dejar que el usuario choque contra ese error.
 */
interface DestructiveConfig {
  icon: typeof FiXCircle
  label: string
  title: string
  message: string
  confirmText: string
  esTerminal: (row: Row) => boolean
}

const DESTRUCTIVE_CONFIG: Partial<Record<Resource, DestructiveConfig>> = {
  'conceptos-cobro': {
    icon: FiPause, label: 'Desactivar', title: 'Desactivar concepto de cobro',
    message: 'Dejará de estar disponible para generar nuevas órdenes. Esta acción conserva su historial.',
    confirmText: 'Desactivar', esTerminal: (r) => r.estado === 'inactivo',
  },
  combos: {
    icon: FiPause, label: 'Desactivar', title: 'Desactivar combo',
    message: 'El combo dejará de ofrecerse en el sitio público. Esta acción conserva su historial.',
    confirmText: 'Desactivar', esTerminal: (r) => r.estado === 'inactivo',
  },
  descuentos: {
    icon: FiPause, label: 'Desactivar', title: 'Desactivar descuento',
    message: 'El descuento dejará de aplicarse a nuevas órdenes. Esta acción conserva su historial.',
    confirmText: 'Desactivar', esTerminal: (r) => r.estado === 'inactivo',
  },
  matriculas: {
    icon: FiXCircle, label: 'Anular', title: 'Anular matrícula',
    message: 'Esta acción anula la matrícula y no genera reembolso de los pagos ya realizados.',
    confirmText: 'Anular', esTerminal: (r) => r.estado === 'anulada',
  },
}

/**
 * Vuelta atrás de la acción destructiva, para los recursos donde eso tiene sentido de negocio
 * (un toggle activo/inactivo). Deliberadamente NO existe para matriculas: es un registro
 * contable/de auditoría donde el backend hace irreversible la anulación a propósito — un
 * "deshacer" ahí falsearía el historial, así que no se agrega aunque el patrón sea el mismo.
 */
interface ReactivateConfig {
  icon: typeof FiXCircle
  label: string
  successMessage: string
  call: (id: string) => Promise<unknown>
}

const REACTIVATE_CONFIG: Partial<Record<Resource, ReactivateConfig>> = {
  'conceptos-cobro': { icon: FiPlay, label: 'Activar', successMessage: 'El concepto vuelve a estar disponible.', call: activarConceptoCobro },
  combos: { icon: FiPlay, label: 'Activar', successMessage: 'El combo vuelve a estar disponible.', call: activarCombo },
  descuentos: { icon: FiPlay, label: 'Activar', successMessage: 'El descuento vuelve a estar disponible.', call: activarDescuento },
}

export default function AdminResourcePage() {
  const resource = routeResource(useLocation().pathname)
  const { addToast } = useToast(); const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Row | null>(null); const [confirm, setConfirm] = useState<Row | null>(null); const [showForm, setShowForm] = useState(false)
  const queryKey = ['admin', resource]
  const query = useQuery({ queryKey, queryFn: () => load(resource) })
  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const mutation = useMutation({
    mutationFn: async (row: Row) => {
      if (resource === 'conceptos-cobro') return desactivarConceptoCobro(row.id)
      if (resource === 'combos') return deleteCombo(row.id)
      if (resource === 'descuentos') return deleteDescuento(row.id)
      return anularMatricula(row.id, 'Anulación desde panel administrativo')
    },
    onSuccess: () => { invalidate(); setConfirm(null); addToast('success', 'Cambio guardado', 'La operación se completó correctamente.') },
    onError: () => addToast('error', 'No se pudo completar la operación', 'Inténtalo nuevamente en unos segundos.'),
  })

  const reactivateConfig = REACTIVATE_CONFIG[resource]
  const reactivarMutation = useMutation({
    mutationFn: (id: string) => {
      if (!reactivateConfig) return Promise.reject(new Error('Este recurso no admite reactivar'))
      return reactivateConfig.call(id)
    },
    onSuccess: () => { invalidate(); addToast('success', 'Reactivado', reactivateConfig?.successMessage ?? 'El registro se reactivó correctamente.') },
    onError: () => addToast('error', 'No se pudo reactivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const rows = query.data ?? []; const fields = keys[resource]
  const fieldColumns: DataTableColumn<Row>[] = fields.map((key) => ({ header: key.replaceAll('_', ' '), accessor: key, render: (row) => key === 'estado' || key === 'rol' || key === 'tipo' ? <Badge value={label(row[key])} /> : label(row[key]) }))

  const destructiveConfig = DESTRUCTIVE_CONFIG[resource]
  const columns: DataTableColumn<Row>[] = destructiveConfig
    ? [
        ...fieldColumns,
        {
          header: 'Acciones',
          accessor: 'id',
          render: (row) => (
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {destructiveConfig && !destructiveConfig.esTerminal(row) && (
                <button
                  type="button"
                  onClick={() => setConfirm(row)}
                  disabled={mutation.isPending}
                  className={iconButtonClasses('destructive')}
                  title={destructiveConfig.label}
                >
                  <destructiveConfig.icon />
                </button>
              )}
              {destructiveConfig && reactivateConfig && destructiveConfig.esTerminal(row) && (
                <button
                  type="button"
                  onClick={() => reactivarMutation.mutate(row.id)}
                  disabled={reactivarMutation.isPending}
                  className={iconButtonClasses('primary')}
                  title={reactivateConfig.label}
                >
                  <reactivateConfig.icon />
                </button>
              )}
            </div>
          ),
        },
      ]
    : fieldColumns

  const canCreate = ['conceptos-cobro', 'combos', 'descuentos'].includes(resource)

  return <div className="space-y-6">
    <PageHeader title={titles[resource]} subtitle="Gestiona los registros desde la API institucional." action={canCreate ? <Button variant="primary" onClick={() => setShowForm(true)}>Nuevo</Button> : undefined} />
    <DataTable columns={columns} data={rows} isLoading={query.isLoading} getRowKey={(row) => row.id} onRowClick={(row) => setSelected(row)} />
    <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Nuevo ${titles[resource].toLowerCase()}`}><ResourceForm resource={resource} onDone={() => { setShowForm(false); invalidate() }} /></Modal>
    <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle">
      {selected && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2" style={{ fontFamily: 'var(--font-body)' }}>
          {fieldColumns.map((col) => (
            <div key={String(col.accessor)}>
              <dt className="mb-1 text-[13px] font-semibold capitalize text-[var(--color-text-secondary)]">{col.header}</dt>
              <dd className="text-sm text-[var(--color-text-main)]">{col.render ? col.render(selected) : label(selected[col.accessor])}</dd>
            </div>
          ))}
        </div>
      )}
    </Modal>
    <ConfirmModal
      isOpen={!!confirm}
      title={(confirm && destructiveConfig?.title) || 'Confirmar operación'}
      message={(confirm && destructiveConfig?.message) || 'Esta acción cambia el estado del registro y no elimina su historial.'}
      onCancel={() => setConfirm(null)}
      onConfirm={() => confirm && mutation.mutate(confirm)}
      variant="destructive"
      isConfirming={mutation.isPending}
      confirmText={destructiveConfig?.confirmText ?? 'Confirmar'}
    />
  </div>
}

const CONCEPTO_TIPO_OPTIONS = [
  { value: 'matricula', label: 'Matrícula' },
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'curso', label: 'Curso' },
  { value: 'pension', label: 'Pensión' },
  { value: 'gratuito', label: 'Gratuito' },
]
const DESCUENTO_TIPO_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'pronto_pago', label: 'Pronto pago' },
]

const selectClass =
  'w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-[14px] py-[10px] text-sm text-[var(--color-text-main)] outline-none transition-colors focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(0,175,240,0.1)]'

function ResourceForm({ resource, onDone }: { resource: Resource; onDone: () => void }) {
  const [value, setValue] = useState<Record<string, string>>({})
  const [programaIds, setProgramaIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const necesitaProgramas = resource === 'conceptos-cobro' || resource === 'combos'
  const necesitaConceptos = resource === 'descuentos'
  const { data: programas } = useQuery({ queryKey: ['admin', 'programas', 'ref'], queryFn: () => fetchProgramas(), enabled: necesitaProgramas })
  const { data: conceptos } = useQuery({ queryKey: ['admin', 'conceptos-cobro', 'ref'], queryFn: () => getConceptosCobro(), enabled: necesitaConceptos })

  const change = (name: string, val: string) => setValue((old) => ({ ...old, [name]: val }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (resource === 'conceptos-cobro') {
        await createConceptoCobro({
          tipo: value.tipo as ConceptoCobroTipo,
          monto: value.tipo === 'gratuito' ? 0 : Number(value.monto),
          programa_id: value.programa_id,
          descripcion: value.descripcion || undefined,
        })
      } else if (resource === 'combos') {
        await createCombo({ nombre: value.nombre, vigencia_inicio: value.vigencia_inicio, vigencia_fin: value.vigencia_fin, programa_ids: programaIds })
      } else if (resource === 'descuentos') {
        await createDescuento({ tipo: value.tipo as DescuentoTipo, porcentaje: Number(value.porcentaje), concepto_id: value.concepto_id, descripcion: value.descripcion || undefined })
      }
      addToast('success', 'Creado', 'El registro fue creado.')
      onDone()
    } catch {
      setError('No se pudo crear el registro. Revisa los datos e inténtalo nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{error}</p>}

      {resource === 'conceptos-cobro' && (
        <>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">Tipo</label>
            <select className={selectClass} value={value.tipo ?? ''} onChange={(e) => change('tipo', e.target.value)} required>
              <option value="">Selecciona</option>
              {CONCEPTO_TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {value.tipo !== 'gratuito' && (
            <FormInput label="Monto (S/)" type="number" value={value.monto ?? ''} onChange={(v) => change('monto', v)} required />
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">Programa</label>
            <select className={selectClass} value={value.programa_id ?? ''} onChange={(e) => change('programa_id', e.target.value)} required>
              <option value="">Selecciona</option>
              {(programas ?? []).map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
            </select>
          </div>
          <FormInput label="Descripción" value={value.descripcion ?? ''} onChange={(v) => change('descripcion', v)} hint="Opcional" />
        </>
      )}

      {resource === 'descuentos' && (
        <>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">Tipo</label>
            <select className={selectClass} value={value.tipo ?? ''} onChange={(e) => change('tipo', e.target.value)} required>
              <option value="">Selecciona</option>
              {DESCUENTO_TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <FormInput label="Porcentaje (0.1 – 30)" type="number" value={value.porcentaje ?? ''} onChange={(v) => change('porcentaje', v)} required />
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">Concepto de cobro</label>
            <select className={selectClass} value={value.concepto_id ?? ''} onChange={(e) => change('concepto_id', e.target.value)} required>
              <option value="">Selecciona</option>
              {(conceptos ?? []).map((c) => <option key={c.id} value={c.id}>{c.tipo} — S/ {c.monto}</option>)}
            </select>
          </div>
          <FormInput label="Descripción" value={value.descripcion ?? ''} onChange={(v) => change('descripcion', v)} hint="Opcional" />
        </>
      )}

      {resource === 'combos' && (
        <>
          <FormInput label="Nombre" value={value.nombre ?? ''} onChange={(v) => change('nombre', v)} required />
          <FormInput label="Vigencia inicio" type="date" value={value.vigencia_inicio ?? ''} onChange={(v) => change('vigencia_inicio', v)} required />
          <FormInput label="Vigencia fin" type="date" value={value.vigencia_fin ?? ''} onChange={(v) => change('vigencia_fin', v)} required />
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">Programas incluidos (mínimo 2)</label>
            <select
              multiple
              className={`${selectClass} h-32`}
              value={programaIds}
              onChange={(e) => setProgramaIds(Array.from(e.target.selectedOptions, (o) => o.value))}
              required
            >
              {(programas ?? []).map((p) => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">Ctrl/Cmd + clic para seleccionar varios.</p>
          </div>
        </>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
