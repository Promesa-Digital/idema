import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../hooks/useToast'
import { getUsuarios, createUsuario, deleteUsuario } from '../../api/usuarios'
import { getConceptosCobro, createConceptoCobro, deleteConceptoCobro } from '../../api/conceptosCobro'
import { getCombos, createCombo, deleteCombo } from '../../api/combos'
import { getDescuentos, createDescuento, deleteDescuento } from '../../api/descuentos'
import { getLeads, updateLeadEstado } from '../../api/leads'
import { getCuentasAlumno, darDeBajaCuenta } from '../../api/cuentasAlumno'
import { getMatriculas, anularMatricula } from '../../api/matriculas'
import { getOrdenes, confirmarTransferencia, anularOrden } from '../../api/ordenes'
import { getComprobantes, anularComprobante } from '../../api/comprobantes'
import { getConciliaciones, createConciliacion, cerrarConciliacion } from '../../api/conciliaciones'
import { getElectivos } from '../../api/electivos'

type Resource = 'usuarios' | 'conceptos-cobro' | 'combos' | 'descuentos' | 'leads' | 'cuentas-alumnos' | 'matriculas' | 'ordenes' | 'comprobantes' | 'conciliaciones' | 'electivos'
type Row = Record<string, unknown> & { id: string; estado?: string }
const titles: Record<Resource, string> = { usuarios: 'Usuarios', 'conceptos-cobro': 'Conceptos de cobro', combos: 'Combos', descuentos: 'Descuentos', leads: 'Leads', 'cuentas-alumnos': 'Cuentas de alumnos', matriculas: 'Matrículas', ordenes: 'Órdenes', comprobantes: 'Comprobantes', conciliaciones: 'Conciliaciones', electivos: 'Electivos' }
const keys: Record<Resource, string[]> = { usuarios: ['nombre', 'correo', 'rol', 'estado'], 'conceptos-cobro': ['tipo', 'programa_id', 'monto', 'estado'], combos: ['nombre', 'programa_ids', 'vigencia_inicio', 'vigencia_fin', 'estado'], descuentos: ['tipo', 'concepto_id', 'porcentaje', 'estado'], leads: ['nombre', 'correo', 'telefono', 'origen', 'estado', 'created_at'], 'cuentas-alumnos': ['dni', 'nombres', 'apellidos', 'correo', 'estado'], matriculas: ['alumno_id', 'programa_id', 'tipo', 'estado', 'created_at'], ordenes: ['alumno_id', 'concepto_id', 'monto', 'medio_pago', 'estado', 'created_at'], comprobantes: ['tipo', 'numero', 'nombre_pagador', 'estado', 'fecha_emision'], conciliaciones: ['periodo_inicio', 'periodo_fin', 'monto_esperado', 'monto_abonado', 'estado'], electivos: ['matricula_id', 'programa_id', 'estado', 'fecha_activacion'] }
function routeResource(path: string): Resource { return path.split('/').filter(Boolean).at(-1) as Resource }
function label(value: unknown): string { return Array.isArray(value) ? value.join(', ') : value == null ? '—' : String(value) }

async function load(resource: Resource): Promise<Row[]> {
  const loaders: Record<Resource, () => Promise<unknown[]>> = {
    usuarios: getUsuarios, 'conceptos-cobro': getConceptosCobro, combos: getCombos, descuentos: () => getDescuentos(), leads: getLeads,
    'cuentas-alumnos': getCuentasAlumno, matriculas: getMatriculas, ordenes: () => getOrdenes(), comprobantes: getComprobantes, conciliaciones: getConciliaciones, electivos: getElectivos,
  }
  return (await loaders[resource]()) as Row[]
}

export default function AdminResourcePage() {
  const resource = routeResource(useLocation().pathname)
  const { addToast } = useToast(); const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Row | null>(null); const [confirm, setConfirm] = useState<Row | null>(null); const [showForm, setShowForm] = useState(false)
  const queryKey = ['admin', resource]
  const query = useQuery({ queryKey, queryFn: () => load(resource) })
  const mutation = useMutation({ mutationFn: async (row: Row) => {
    if (resource === 'usuarios') return deleteUsuario(row.id)
    if (resource === 'conceptos-cobro') return deleteConceptoCobro(row.id)
    if (resource === 'combos') return deleteCombo(row.id)
    if (resource === 'descuentos') return deleteDescuento(row.id)
    if (resource === 'cuentas-alumnos') return darDeBajaCuenta(row.id)
    if (resource === 'matriculas') return anularMatricula(row.id, 'Anulación desde panel administrativo')
    if (resource === 'ordenes') return anularOrden(row.id, 'Anulación desde panel administrativo')
    if (resource === 'comprobantes') return anularComprobante(row.id, 'Anulación desde panel administrativo')
    if (resource === 'conciliaciones') return cerrarConciliacion(row.id)
    return updateLeadEstado(row.id, 'descartado')
  }, onSuccess: () => { queryClient.invalidateQueries({ queryKey }); setConfirm(null); addToast('success', 'Cambio guardado', 'La operación se completó correctamente.') } })
  const rows = query.data ?? []; const fields = keys[resource]
  const columns: DataTableColumn<Row>[] = fields.map((key) => ({ header: key.replaceAll('_', ' '), accessor: key, render: (row) => key === 'estado' || key === 'rol' || key === 'tipo' ? <Badge value={label(row[key])} /> : label(row[key]) }))
  const destructive = ['usuarios', 'conceptos-cobro', 'combos', 'descuentos', 'cuentas-alumnos', 'matriculas', 'ordenes', 'comprobantes', 'conciliaciones', 'leads'].includes(resource)
  const canCreate = ['usuarios', 'conceptos-cobro', 'combos', 'descuentos', 'conciliaciones'].includes(resource)
  return <div className="space-y-6">
    <PageHeader title={titles[resource]} subtitle="Gestiona los registros desde la API institucional." action={canCreate ? <button className="rounded-lg bg-[var(--admin-color-primary)] px-4 py-2 font-semibold text-white" onClick={() => setShowForm(true)}>Nuevo</button> : undefined} />
    <DataTable columns={columns} data={rows} isLoading={query.isLoading} getRowKey={(row) => row.id} onRowClick={(row) => setSelected(row)} />
    <div className="flex flex-wrap gap-2">{rows.map((row) => <span key={row.id}>{destructive && row.estado !== 'inactivo' && row.estado !== 'anulada' && <button className="text-xs text-red-600 underline" onClick={() => setConfirm(row)}>Desactivar / anular {row.id.slice(0, 8)}</button>}{resource === 'leads' && row.estado === 'nuevo' && <button className="ml-3 text-xs text-blue-700 underline" onClick={() => updateLeadEstado(row.id, 'contactado').then(() => queryClient.invalidateQueries({ queryKey }))}>Marcar contactado</button>}{resource === 'ordenes' && row.estado === 'pendiente_confirmacion' && <button className="ml-3 text-xs text-emerald-700 underline" onClick={() => confirmarTransferencia(row.id).then(() => queryClient.invalidateQueries({ queryKey }))}>Confirmar transferencia</button>}</span>)}</div>
    <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Nuevo ${titles[resource].toLowerCase()}`}><ResourceForm resource={resource} onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey }) }} /></Modal>
    <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle"><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(selected, null, 2)}</pre></Modal>
    <ConfirmModal isOpen={!!confirm} title="Confirmar operación" message="Esta acción cambia el estado del registro y no elimina su historial." onCancel={() => setConfirm(null)} onConfirm={() => confirm && mutation.mutate(confirm)} variant="destructive" isConfirming={mutation.isPending} />
  </div>
}

function ResourceForm({ resource, onDone }: { resource: Resource; onDone: () => void }) {
  const [value, setValue] = useState<Record<string, string>>({}); const { addToast } = useToast()
  const fields = resource === 'usuarios' ? ['nombre', 'correo', 'password', 'rol'] : resource === 'conciliaciones' ? ['periodo_inicio', 'periodo_fin'] : resource === 'conceptos-cobro' ? ['tipo', 'monto', 'programa_id', 'descripcion'] : resource === 'descuentos' ? ['tipo', 'porcentaje', 'concepto_id', 'descripcion'] : ['nombre', 'vigencia_inicio', 'vigencia_fin', 'programa_ids']
  const submit = async (event: React.FormEvent) => { event.preventDefault(); const data = { ...value }; if (resource === 'usuarios') await createUsuario(data as never); else if (resource === 'conceptos-cobro') await createConceptoCobro({ ...data, monto: data.tipo === 'gratuito' ? 0 : Number(data.monto) } as never); else if (resource === 'combos') await createCombo({ ...data, programa_ids: data.programa_ids.split(',').map((id) => id.trim()) } as never); else if (resource === 'descuentos') await createDescuento({ ...data, porcentaje: Number(data.porcentaje) } as never); else await createConciliacion(data as never); addToast('success', 'Creado', 'El registro fue creado.'); onDone() }
  return <form onSubmit={submit} className="space-y-3">{fields.map((field) => <label key={field} className="block text-sm font-semibold">{field.replaceAll('_', ' ')}<input required className="mt-1 w-full rounded-lg border p-2.5" type={field.includes('fecha') || field.includes('periodo') ? 'date' : field === 'password' ? 'password' : 'text'} value={value[field] ?? ''} onChange={(event) => setValue((old) => ({ ...old, [field]: event.target.value }))} /></label>)}<button className="w-full rounded-lg bg-[var(--admin-color-primary)] p-3 font-semibold text-white">Guardar</button></form>
}
