import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { useAlumnoAuth } from '@/context/AlumnoAuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  actualizarConsentimientoAlumno,
  actualizarPasswordAlumno,
  actualizarPerfilAlumno,
  darDeBajaMiCuenta,
  obtenerHistorialAlumno,
} from '@/services/alumnoApi'
import type { AlumnoPerfilUpdate, PortalAlumnoHistorial } from '@/types/backend'

type Tab = 'resumen' | 'matriculas' | 'pagos' | 'comprobantes' | 'perfil'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'matriculas', label: 'Matrículas y electivos' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'comprobantes', label: 'Comprobantes' },
  { id: 'perfil', label: 'Perfil y seguridad' },
]

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' })
const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

function formatDate(value: string | null): string {
  if (!value) return 'Pendiente'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date)
}

function formatCurrency(value: string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? CURRENCY_FORMATTER.format(amount) : `S/ ${value}`
}

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function profileFromAlumno(alumno: ReturnType<typeof useAlumnoAuth>['alumno']): AlumnoPerfilUpdate {
  return alumno ? {
    nombres: alumno.nombres,
    apellido_paterno: alumno.apellido_paterno,
    apellido_materno: alumno.apellido_materno ?? '',
    dni: alumno.dni,
    correo: alumno.correo,
    telefono: alumno.telefono,
  } : {}
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-slate-500">{children}</div>
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-dark">{value}</p>
    </div>
  )
}

export default function MiCuentaPage() {
  const { alumno, token, logout, refreshAlumno } = useAlumnoAuth()
  const [tab, setTab] = useState<Tab>('resumen')
  const [historial, setHistorial] = useState<PortalAlumnoHistorial | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [profile, setProfile] = useState<AlumnoPerfilUpdate>(() => profileFromAlumno(alumno))
  const [password, setPassword] = useState({ actual: '', nueva: '', confirmacion: '' })

  const loadHistorial = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setLoadError('')
    try {
      setHistorial(await obtenerHistorialAlumno(token))
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        logout()
        return
      }
      setLoadError(messageFrom(error, 'No se pudo cargar tu información.'))
    } finally {
      setIsLoading(false)
    }
  }, [logout, token])

  useEffect(() => {
    if (!token) return
    let isActive = true
    obtenerHistorialAlumno(token)
      .then((data) => {
        if (isActive) setHistorial(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) logout()
        else setLoadError(messageFrom(error, 'No se pudo cargar tu información.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [logout, token])

  const summary = useMemo(
    () => ({
      matriculas: historial?.matriculas.length ?? 0,
      electivos: historial?.electivos.length ?? 0,
      pagos: historial?.ordenes.length ?? 0,
      comprobantes: historial?.comprobantes.length ?? 0,
    }),
    [historial],
  )

  const handleProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return
    setIsSaving(true)
    setActionError('')
    setFeedback('')
    try {
      await actualizarPerfilAlumno(token, profile)
      await Promise.all([refreshAlumno(), loadHistorial()])
      setFeedback('Tus datos fueron actualizados correctamente.')
    } catch (error) {
      setActionError(messageFrom(error, 'No se pudo actualizar tu perfil.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return
    setActionError('')
    setFeedback('')
    if (password.nueva !== password.confirmacion) {
      setActionError('Las contraseñas nuevas no coinciden.')
      return
    }
    setIsSaving(true)
    try {
      await actualizarPasswordAlumno(token, password.actual, password.nueva)
      setPassword({ actual: '', nueva: '', confirmacion: '' })
      setFeedback('Tu contraseña fue actualizada.')
    } catch (error) {
      setActionError(messageFrom(error, 'No se pudo actualizar tu contraseña.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleConsent = async () => {
    if (!token || !alumno) return
    setIsSaving(true)
    setActionError('')
    setFeedback('')
    try {
      await actualizarConsentimientoAlumno(token, !alumno.consentimiento_datos)
      await Promise.all([refreshAlumno(), loadHistorial()])
      setFeedback(alumno.consentimiento_datos ? 'Revocaste tu consentimiento.' : 'Tu consentimiento fue registrado.')
    } catch (error) {
      setActionError(messageFrom(error, 'No se pudo actualizar el consentimiento.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!token) return
    setIsSaving(true)
    setActionError('')
    try {
      await darDeBajaMiCuenta(token)
      logout()
    } catch (error) {
      setShowDeactivate(false)
      setActionError(messageFrom(error, 'No se pudo dar de baja la cuenta.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link to="/" className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA</Link>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Mi cuenta</h1>
            <p className="mt-1 text-sm text-white/70">Hola, {alumno?.nombres}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-white/80 transition hover:bg-white/10">Ir al sitio</Link>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>Cerrar sesión</Button>
          </div>
        </div>
        <nav aria-label="Secciones de mi cuenta" className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
          {TABS.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === item.id ? 'bg-white text-dark' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {feedback && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{feedback}</div>}
        {actionError && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl bg-white"><div className="text-center text-slate-600"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />Cargando tu cuenta...</div></div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center"><p role="alert" className="mb-4 text-red-700">{loadError}</p><Button onClick={() => void loadHistorial()}>Reintentar</Button></div>
        ) : historial && (
          <>
            {tab === 'resumen' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Matrículas" value={summary.matriculas} />
                  <SummaryCard label="Electivos" value={summary.electivos} />
                  <SummaryCard label="Órdenes de pago" value={summary.pagos} />
                  <SummaryCard label="Comprobantes" value={summary.comprobantes} />
                </div>
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-dark">Datos de tu cuenta</h2>
                  <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Nombre completo</dt><dd className="mt-1 text-dark">{historial.perfil.nombres} {historial.perfil.apellido_paterno} {historial.perfil.apellido_materno}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">DNI</dt><dd className="mt-1 text-dark">{historial.perfil.dni}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Correo</dt><dd className="mt-1 break-all text-dark">{historial.perfil.correo}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Teléfono</dt><dd className="mt-1 text-dark">{historial.perfil.telefono}</dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Estado</dt><dd className="mt-1"><Badge variant="emerald">Activa</Badge></dd></div>
                    <div><dt className="text-xs font-bold uppercase text-slate-500">Miembro desde</dt><dd className="mt-1 text-dark">{formatDate(historial.perfil.created_at)}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            {tab === 'matriculas' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-xl font-bold text-dark">Mis matrículas</h2>
                  <div className="space-y-4">
                    {historial.matriculas.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-dark">{item.programa_nombre}</h3><p className="mt-1 text-sm text-slate-500">{item.programa_codigo} · Matrícula {item.tipo}</p></div><Badge variant={item.estado === 'activa' ? 'emerald' : item.estado === 'anulada' ? 'red' : 'amber'}>{item.estado}</Badge></div><p className="mt-3 text-sm text-slate-600">Activación: {formatDate(item.fecha_activacion)}</p></article>)}
                    {historial.matriculas.length === 0 && <EmptyState>Aún no tienes matrículas registradas.</EmptyState>}
                  </div>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-xl font-bold text-dark">Mis electivos</h2>
                  <div className="space-y-4">
                    {historial.electivos.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-dark">{item.programa_nombre}</h3><p className="mt-1 text-sm text-slate-500">{item.programa_codigo}{item.gratuito ? ' · Gratuito' : ''}</p></div><Badge variant={item.estado === 'completado' ? 'emerald' : item.estado === 'cancelado' ? 'red' : 'sky'}>{item.estado.replace('_', ' ')}</Badge></div><p className="mt-3 text-sm text-slate-600">Activado: {formatDate(item.fecha_activacion)}</p></article>)}
                    {historial.electivos.length === 0 && <EmptyState>Aún no tienes electivos registrados.</EmptyState>}
                  </div>
                </section>
              </div>
            )}

            {tab === 'pagos' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold text-dark">Mis órdenes de pago</h2>
                <div className="space-y-4">
                  {historial.ordenes.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-dark">{item.concepto}</h3><p className="mt-1 text-sm text-slate-500">{item.medio_pago} · Creada el {formatDate(item.created_at)}</p>{item.fecha_pago && <p className="mt-1 text-sm text-slate-500">Pagada el {formatDate(item.fecha_pago)}</p>}</div><div className="flex items-center gap-3 sm:text-right"><Badge variant={item.estado === 'pagada' || item.estado === 'conciliada' ? 'emerald' : item.estado === 'fallida' || item.estado === 'anulada' ? 'red' : 'amber'}>{item.estado.replace('_', ' ')}</Badge><strong className="text-lg text-dark">{formatCurrency(item.monto)}</strong></div></article>)}
                  {historial.ordenes.length === 0 && <EmptyState>Aún no tienes órdenes de pago.</EmptyState>}
                </div>
              </section>
            )}

            {tab === 'comprobantes' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold text-dark">Mis comprobantes</h2>
                <div className="space-y-4">
                  {historial.comprobantes.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold capitalize text-dark">{item.tipo} {item.numero ?? 'pendiente de numeración'}</h3><p className="mt-1 text-sm text-slate-500">{item.nombre_pagador} · {formatDate(item.fecha_emision)}</p>{item.razon_social && <p className="mt-1 text-sm text-slate-500">{item.razon_social} · RUC {item.ruc}</p>}</div><Badge variant={item.estado === 'emitido' ? 'emerald' : item.estado === 'anulado' ? 'red' : 'amber'}>{item.estado}</Badge></article>)}
                  {historial.comprobantes.length === 0 && <EmptyState>Aún no tienes comprobantes emitidos.</EmptyState>}
                </div>
              </section>
            )}

            {tab === 'perfil' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-xl font-bold text-dark">Datos personales</h2>
                  <form onSubmit={handleProfile} className="grid gap-4 sm:grid-cols-2">
                    <Input label="Nombres" value={profile.nombres ?? ''} onChange={(event) => setProfile((current) => ({ ...current, nombres: event.target.value }))} required disabled={isSaving} />
                    <Input label="Apellido paterno" value={profile.apellido_paterno ?? ''} onChange={(event) => setProfile((current) => ({ ...current, apellido_paterno: event.target.value }))} required disabled={isSaving} />
                    <Input label="Apellido materno" value={profile.apellido_materno ?? ''} onChange={(event) => setProfile((current) => ({ ...current, apellido_materno: event.target.value }))} disabled={isSaving} />
                    <Input label="DNI" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={profile.dni ?? ''} onChange={(event) => setProfile((current) => ({ ...current, dni: event.target.value.replace(/\D/g, '') }))} required disabled={isSaving} />
                    <Input label="Correo" type="email" value={profile.correo ?? ''} onChange={(event) => setProfile((current) => ({ ...current, correo: event.target.value }))} required disabled={isSaving} />
                    <Input label="Teléfono" type="tel" value={profile.telefono ?? ''} onChange={(event) => setProfile((current) => ({ ...current, telefono: event.target.value }))} required disabled={isSaving} />
                    <div className="sm:col-span-2"><Button type="submit" isLoading={isSaving}>Guardar datos</Button></div>
                  </form>
                </section>
                <div className="space-y-6">
                  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-xl font-bold text-dark">Cambiar contraseña</h2>
                    <form onSubmit={handlePassword} className="space-y-4">
                      <Input label="Contraseña actual" type="password" autoComplete="current-password" value={password.actual} onChange={(event) => setPassword((current) => ({ ...current, actual: event.target.value }))} required disabled={isSaving} />
                      <Input label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} hint="Mínimo 8 caracteres, un número y un símbolo" value={password.nueva} onChange={(event) => setPassword((current) => ({ ...current, nueva: event.target.value }))} required disabled={isSaving} />
                      <Input label="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} value={password.confirmacion} onChange={(event) => setPassword((current) => ({ ...current, confirmacion: event.target.value }))} required disabled={isSaving} />
                      <Button type="submit" isLoading={isSaving}>Actualizar contraseña</Button>
                    </form>
                  </section>
                  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-dark">Privacidad y cuenta</h2>
                    <p className="mt-2 text-sm text-slate-600">Consentimiento de datos: <strong>{alumno?.consentimiento_datos ? 'vigente' : 'revocado'}</strong>{alumno?.fecha_consentimiento ? ` desde ${formatDate(alumno.fecha_consentimiento)}` : ''}.</p>
                    <div className="mt-5 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => void handleConsent()} isLoading={isSaving}>{alumno?.consentimiento_datos ? 'Revocar consentimiento' : 'Aceptar consentimiento'}</Button><Button variant="danger" onClick={() => setShowDeactivate(true)}>Dar de baja mi cuenta</Button></div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showDeactivate} onClose={() => setShowDeactivate(false)} title="Dar de baja mi cuenta" size="sm" closeOnBackdrop={!isSaving} footer={<><Button variant="ghost" onClick={() => setShowDeactivate(false)} disabled={isSaving}>Cancelar</Button><Button variant="danger" onClick={() => void handleDeactivate()} isLoading={isSaving}>Confirmar baja</Button></>}>
        <p className="text-slate-700">Tu cuenta quedará inactiva y se cerrará la sesión. Los datos vinculados a pagos o matrículas se conservarán por obligaciones académicas y legales.</p>
      </Modal>
    </main>
  )
}
