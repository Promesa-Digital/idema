import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  actualizarCuentaAlumno,
  darDeBajaCuentaAlumno,
  listarCuentasAlumno,
} from '@/services/cuentasAlumnoApi'
import type { AlumnoPerfilUpdate, CuentaAlumnoBackend, CuentaAlumnoEstado } from '@/types/backend'

function fullName(item: CuentaAlumnoBackend): string {
  return `${item.nombres} ${item.apellido_paterno} ${item.apellido_materno ?? ''}`.trim()
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo completar la operación.'
}

export default function CuentasAlumnoAdminPage() {
  const { user, logout } = useAuth()
  const canEdit = user?.rol === 'administracion'
  const [cuentas, setCuentas] = useState<CuentaAlumnoBackend[]>([])
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<CuentaAlumnoEstado | ''>('')
  const [selected, setSelected] = useState<CuentaAlumnoBackend | null>(null)
  const [form, setForm] = useState<AlumnoPerfilUpdate>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    let isActive = true
    listarCuentasAlumno()
      .then((data) => {
        if (isActive) setCuentas(data)
      })
      .catch((caughtError: unknown) => {
        if (!isActive) return
        if (caughtError instanceof ApiError && caughtError.status === 401) logout()
        else setError(errorMessage(caughtError))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [logout])

  const openDetail = (item: CuentaAlumnoBackend) => {
    setSelected(item)
    setForm({ nombres: item.nombres, apellido_paterno: item.apellido_paterno, apellido_materno: item.apellido_materno ?? '', dni: item.dni, correo: item.correo, telefono: item.telefono })
    setError('')
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return cuentas.filter((item) => (!estado || item.estado === estado) && (!term || fullName(item).toLowerCase().includes(term) || item.dni.includes(term) || item.correo.toLowerCase().includes(term)))
  }, [cuentas, estado, search])

  const sync = (updated: CuentaAlumnoBackend) => {
    setCuentas((current) => current.map((item) => item.id === updated.id ? updated : item))
    setSelected(updated)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected || !canEdit) return
    setIsSaving(true)
    setError('')
    try {
      sync(await actualizarCuentaAlumno(selected.id, form))
      setFeedback('La cuenta del alumno fue actualizada.')
    } catch (caughtError) {
      setError(errorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selected || !canEdit) return
    setIsSaving(true)
    setError('')
    try {
      sync(await darDeBajaCuentaAlumno(selected.id))
      setConfirmDeactivate(false)
      setFeedback('La cuenta quedó inactiva.')
    } catch (caughtError) {
      setConfirmDeactivate(false)
      setError(errorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  const columns = useMemo<TableColumn<CuentaAlumnoBackend>[]>(() => [
    { key: 'alumno', header: 'Alumno', render: (item) => <div><p className="font-semibold text-dark">{fullName(item)}</p><p className="text-xs text-slate-500">DNI {item.dni}</p></div> },
    { key: 'contacto', header: 'Contacto', render: (item) => <div><p>{item.correo}</p><p className="text-xs text-slate-500">{item.telefono}</p></div> },
    { key: 'verificacion', header: 'Correo', render: (item) => <Badge variant={item.correo_verificado_at ? 'emerald' : 'amber'}>{item.correo_verificado_at ? 'Verificado' : 'Pendiente'}</Badge> },
    { key: 'consentimiento', header: 'Consentimiento', render: (item) => <Badge variant={item.consentimiento_datos ? 'emerald' : 'slate'}>{item.consentimiento_datos ? 'Vigente' : 'No vigente'}</Badge> },
    { key: 'estado', header: 'Estado', render: (item) => <Badge variant={item.estado === 'activa' ? 'emerald' : 'red'}>{item.estado}</Badge> },
    { key: 'acciones', header: 'Acciones', render: (item) => <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>{canEdit ? 'Gestionar' : 'Ver detalle'}</Button> },
  ], [canEdit])

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_14rem]"><Input label="Buscar alumno" placeholder="Nombre, DNI o correo" value={search} onChange={(event) => setSearch(event.target.value)} /><Select label="Estado" value={estado} onChange={(event) => setEstado(event.target.value as CuentaAlumnoEstado | '')}><option value="">Todos</option><option value="activa">Activas</option><option value="inactiva">Inactivas</option></Select></div>
        {feedback && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div>}
        {error && !selected && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {isLoading ? <div className="grid min-h-72 place-items-center rounded-xl bg-white text-slate-600">Cargando cuentas...</div> : <Table columns={columns} data={filtered} getRowKey={(item) => item.id} caption="Cuentas de alumnos" emptyMessage="No hay cuentas que coincidan con la búsqueda." />}
      </div>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={canEdit ? 'Gestionar cuenta de alumno' : 'Detalle de cuenta'} size="lg" closeOnBackdrop={!isSaving} footer={<><Button variant="ghost" onClick={() => setSelected(null)} disabled={isSaving}>Cerrar</Button>{canEdit && selected?.estado === 'activa' && <Button variant="danger" onClick={() => setConfirmDeactivate(true)} disabled={isSaving}>Dar de baja</Button>}{canEdit && <Button type="submit" form="account-form" isLoading={isSaving}>Guardar cambios</Button>}</>}>
        {selected && <form id="account-form" onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2"><Input label="Nombres" value={form.nombres ?? ''} onChange={(event) => setForm((current) => ({ ...current, nombres: event.target.value }))} disabled={!canEdit || isSaving} required /><Input label="Apellido paterno" value={form.apellido_paterno ?? ''} onChange={(event) => setForm((current) => ({ ...current, apellido_paterno: event.target.value }))} disabled={!canEdit || isSaving} required /><Input label="Apellido materno" value={form.apellido_materno ?? ''} onChange={(event) => setForm((current) => ({ ...current, apellido_materno: event.target.value }))} disabled={!canEdit || isSaving} /><Input label="DNI" value={form.dni ?? ''} onChange={(event) => setForm((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '') }))} maxLength={8} disabled={!canEdit || isSaving} required /><Input label="Correo" type="email" value={form.correo ?? ''} onChange={(event) => setForm((current) => ({ ...current, correo: event.target.value }))} disabled={!canEdit || isSaving} required /><Input label="Teléfono" value={form.telefono ?? ''} onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))} disabled={!canEdit || isSaving} required /><div className="rounded-lg bg-slate-50 p-4 text-sm sm:col-span-2"><p><strong>Estado:</strong> {selected.estado}</p><p className="mt-1"><strong>Consentimiento:</strong> {selected.consentimiento_datos ? `vigente (${selected.version_politica ?? 'versión no indicada'})` : 'no vigente'}</p><p className="mt-1 break-all"><strong>Lead de origen:</strong> {selected.lead_origen_id ?? 'No vinculado'}</p></div>{error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}</form>}
      </Modal>

      <Modal isOpen={confirmDeactivate} onClose={() => setConfirmDeactivate(false)} title="Confirmar baja" size="sm" closeOnBackdrop={!isSaving} footer={<><Button variant="ghost" onClick={() => setConfirmDeactivate(false)} disabled={isSaving}>Cancelar</Button><Button variant="danger" onClick={() => void handleDeactivate()} isLoading={isSaving}>Dar de baja</Button></>}><p className="text-slate-700">La cuenta quedará inactiva. Si tiene historial académico o financiero, sus datos se conservarán.</p></Modal>
    </main>
  )
}
