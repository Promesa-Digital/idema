import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Users, BookOpen, UserPlus, Image, ShoppingCart, CheckSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getUsuarios } from '../../api/usuarios'
import { fetchProgramas } from '../../api/adminProgramasApi'
import { fetchPopups } from '../../api/adminPopupsApi'
import { getLeads } from '../../api/leads'
import { getOrdenes } from '../../api/ordenes'
import { getConciliaciones } from '../../api/conciliaciones'
import { PROGRAMA_CATEGORIA_LABELS } from '../../types/admin'
import type { Usuario, ProgramaPublico as _unused } from '../../types'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/ui/DataTable'
import type { DataTableColumn } from '../../components/ui/DataTable'
import { formatFecha, formatMonto } from '../../utils/format'

const cardStyle = {
  backgroundColor: 'var(--color-bg-card)',
  borderColor: 'var(--color-border)',
}

function KpiCard({ label, value, icon: Icon, isLoading }: { label: string; value: number; icon: LucideIcon; isLoading: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border p-5 shadow-[var(--shadow-card)]" style={cardStyle}>
      <div className="flex items-center gap-3">
        <span className="rounded-full p-2.5" style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-primary)' }}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-headline)' }}>
        {isLoading ? '—' : value}
      </p>
    </div>
  )
}

const selectClass =
  'rounded-[var(--radius-sm)] border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition'

function Welcome({ nombre }: { nombre: string }) {
  const hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold capitalize" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-headline)' }}>
        Hola, {nombre}
      </h1>
      <p className="mt-1 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>{hoy}</p>
    </div>
  )
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--color-text-main)' }}>{title}</h2>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// admin_sistema
// ---------------------------------------------------------------------------
function AdminSistemaDashboard() {
  const [rolFiltro, setRolFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({ queryKey: ['dashboard', 'usuarios'], queryFn: getUsuarios })
  const { data: programas, isLoading: loadingProgramas } = useQuery({ queryKey: ['dashboard', 'programas'], queryFn: () => fetchProgramas() })
  const { data: leads, isLoading: loadingLeads } = useQuery({ queryKey: ['dashboard', 'leads'], queryFn: () => getLeads() })
  const { data: popups, isLoading: loadingPopups } = useQuery({ queryKey: ['dashboard', 'popups'], queryFn: () => fetchPopups() })

  const filas = useMemo(() => {
    let rows = usuarios ?? []
    if (rolFiltro) rows = rows.filter((u) => u.rol === rolFiltro)
    if (estadoFiltro) rows = rows.filter((u) => u.estado === estadoFiltro)
    return rows
  }, [usuarios, rolFiltro, estadoFiltro])

  const columns: DataTableColumn<Usuario>[] = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Rol', accessor: 'rol', render: (u) => <Badge value={u.rol} /> },
    { header: 'Estado', accessor: 'estado', render: (u) => <Badge value={u.estado} /> },
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Usuarios activos" value={(usuarios ?? []).filter((u) => u.estado === 'activo').length} icon={Users} isLoading={loadingUsuarios} />
        <KpiCard label="Programas publicados" value={(programas ?? []).filter((p) => p.estado === 'publicado').length} icon={BookOpen} isLoading={loadingProgramas} />
        <KpiCard label="Leads nuevos" value={(leads ?? []).filter((l) => l.estado === 'nuevo').length} icon={UserPlus} isLoading={loadingLeads} />
        <KpiCard label="Popups en revisión" value={(popups ?? []).filter((p) => p.estado === 'pendiente').length} icon={Image} isLoading={loadingPopups} />
      </div>

      <TableCard title="Usuarios">
        <div className="mb-3 flex flex-wrap gap-3">
          <select value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todos los roles</option>
            {['admin_sistema', 'academico', 'marketing', 'director_marketing', 'ventas', 'administracion'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <DataTable columns={columns} data={filas} isLoading={loadingUsuarios} getRowKey={(u) => u.id} emptyMessage="No hay usuarios que coincidan con los filtros." />
      </TableCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// academico
// ---------------------------------------------------------------------------
function AcademicoDashboard() {
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const { data: programas, isLoading } = useQuery({ queryKey: ['dashboard', 'programas'], queryFn: () => fetchProgramas() })

  const filas = useMemo(() => {
    let rows = programas ?? []
    if (categoriaFiltro) rows = rows.filter((p) => p.categoria === categoriaFiltro)
    return rows
  }, [programas, categoriaFiltro])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total de programas" value={(programas ?? []).length} icon={BookOpen} isLoading={isLoading} />
        <KpiCard label="Publicados" value={(programas ?? []).filter((p) => p.estado === 'publicado').length} icon={CheckSquare} isLoading={isLoading} />
        <KpiCard label="No publicados" value={(programas ?? []).filter((p) => p.estado === 'no_publicado').length} icon={BookOpen} isLoading={isLoading} />
      </div>

      <TableCard title="Programas">
        <div className="mb-3 flex flex-wrap gap-3">
          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todas las categorías</option>
            {Object.entries(PROGRAMA_CATEGORIA_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { header: 'Código', accessor: 'codigo' },
            { header: 'Nombre', accessor: 'nombre' },
            { header: 'Categoría', accessor: 'categoria', render: (p) => PROGRAMA_CATEGORIA_LABELS[p.categoria] },
            { header: 'Estado', accessor: 'estado', render: (p) => <Badge value={p.estado} /> },
          ]}
          data={filas}
          isLoading={isLoading}
          getRowKey={(p) => p.id}
          emptyMessage="No hay programas que coincidan con los filtros."
        />
      </TableCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// marketing / director_marketing
// ---------------------------------------------------------------------------
function MarketingDashboard() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const { data: popups, isLoading } = useQuery({ queryKey: ['dashboard', 'popups'], queryFn: () => fetchPopups() })

  const filas = useMemo(() => {
    let rows = popups ?? []
    if (estadoFiltro) rows = rows.filter((p) => p.estado === estadoFiltro)
    return rows
  }, [popups, estadoFiltro])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Pendientes de aprobación" value={(popups ?? []).filter((p) => p.estado === 'pendiente').length} icon={Image} isLoading={isLoading} />
        <KpiCard label="Publicados" value={(popups ?? []).filter((p) => p.estado === 'publicado').length} icon={CheckSquare} isLoading={isLoading} />
        <KpiCard label="Borradores" value={(popups ?? []).filter((p) => p.estado === 'borrador').length} icon={Image} isLoading={isLoading} />
      </div>

      <TableCard title="Popups">
        <div className="mb-3 flex flex-wrap gap-3">
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todos los estados</option>
            {['borrador', 'pendiente', 'aprobado', 'rechazado', 'publicado', 'finalizado'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { header: 'Texto', accessor: 'texto' },
            { header: 'Tipo', accessor: 'tipo' },
            { header: 'Vigencia', accessor: 'fecha_inicio', render: (p) => `${p.fecha_inicio} → ${p.fecha_fin}` },
            { header: 'Estado', accessor: 'estado', render: (p) => <Badge value={p.estado} /> },
          ]}
          data={filas}
          isLoading={isLoading}
          getRowKey={(p) => p.id}
          emptyMessage="No hay popups que coincidan con los filtros."
        />
      </TableCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// ventas
// ---------------------------------------------------------------------------
function VentasDashboard() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const { data: leads, isLoading } = useQuery({ queryKey: ['dashboard', 'leads'], queryFn: () => getLeads() })

  const filas = useMemo(() => {
    let rows = leads ?? []
    if (estadoFiltro) rows = rows.filter((l) => l.estado === estadoFiltro)
    return rows
  }, [leads, estadoFiltro])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Leads nuevos" value={(leads ?? []).filter((l) => l.estado === 'nuevo').length} icon={UserPlus} isLoading={isLoading} />
        <KpiCard label="Contactados" value={(leads ?? []).filter((l) => l.estado === 'contactado').length} icon={UserPlus} isLoading={isLoading} />
        <KpiCard label="Convertidos" value={(leads ?? []).filter((l) => l.estado === 'pago').length} icon={CheckSquare} isLoading={isLoading} />
      </div>

      <TableCard title="Leads">
        <div className="mb-3 flex flex-wrap gap-3">
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todos los estados</option>
            {['nuevo', 'contactado', 'pago', 'descartado'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { header: 'Nombre', accessor: 'nombre', render: (l) => l.nombre ?? '—' },
            { header: 'Correo', accessor: 'correo', render: (l) => l.correo ?? '—' },
            { header: 'Teléfono', accessor: 'telefono', render: (l) => l.telefono ?? '—' },
            { header: 'Origen', accessor: 'origen' },
            { header: 'Estado', accessor: 'estado', render: (l) => <Badge value={l.estado} /> },
          ]}
          data={filas}
          isLoading={isLoading}
          getRowKey={(l) => l.id}
          emptyMessage="No hay leads que coincidan con los filtros."
        />
      </TableCard>
    </>
  )
}

// ---------------------------------------------------------------------------
// administracion
// ---------------------------------------------------------------------------
function AdministracionDashboard() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const { data: ordenes, isLoading } = useQuery({ queryKey: ['dashboard', 'ordenes'], queryFn: () => getOrdenes() })
  const { data: conciliaciones, isLoading: loadingConciliaciones } = useQuery({ queryKey: ['dashboard', 'conciliaciones'], queryFn: getConciliaciones })

  const filas = useMemo(() => {
    let rows = ordenes ?? []
    if (estadoFiltro) rows = rows.filter((o) => o.estado === estadoFiltro)
    return rows
  }, [ordenes, estadoFiltro])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Órdenes pendientes" value={(ordenes ?? []).filter((o) => o.estado === 'pendiente' || o.estado === 'pendiente_confirmacion').length} icon={ShoppingCart} isLoading={isLoading} />
        <KpiCard label="Órdenes pagadas" value={(ordenes ?? []).filter((o) => o.estado === 'pagada').length} icon={CheckSquare} isLoading={isLoading} />
        <KpiCard label="Conciliaciones abiertas" value={(conciliaciones ?? []).filter((c) => c.estado === 'abierta').length} icon={CheckSquare} isLoading={loadingConciliaciones} />
      </div>

      <TableCard title="Órdenes">
        <div className="mb-3 flex flex-wrap gap-3">
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className={selectClass} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>
            <option value="">Todos los estados</option>
            {['pendiente', 'pagada', 'fallida', 'anulada', 'conciliada', 'pendiente_confirmacion'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={[
            { header: 'Monto', accessor: 'monto', render: (o) => formatMonto(o.monto) },
            { header: 'Medio de pago', accessor: 'medio_pago' },
            { header: 'Estado', accessor: 'estado', render: (o) => <Badge value={o.estado} /> },
            { header: 'Fecha', accessor: 'created_at', render: (o) => formatFecha(o.created_at) },
          ]}
          data={filas}
          isLoading={isLoading}
          getRowKey={(o) => o.id}
          emptyMessage="No hay órdenes que coincidan con los filtros."
        />
      </TableCard>
    </>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <Helmet>
        <title>Dashboard - Panel admin - IDEMA</title>
      </Helmet>

      <Welcome nombre={user?.nombre ?? 'staff'} />

      {user?.role === 'admin_sistema' && <AdminSistemaDashboard />}
      {user?.role === 'academico' && <AcademicoDashboard />}
      {(user?.role === 'marketing' || user?.role === 'director_marketing') && <MarketingDashboard />}
      {user?.role === 'ventas' && <VentasDashboard />}
      {user?.role === 'administracion' && <AdministracionDashboard />}
    </>
  )
}
