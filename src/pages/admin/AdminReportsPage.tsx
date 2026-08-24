import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { getOrdenes } from '../../api/ordenes'
import { fetchPopups } from '../../api/adminPopupsApi'
import type { OrdenPago } from '../../types'
import type { Popup } from '../../types/admin'

function downloadCsv(rows: Array<Record<string, unknown>>, filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url)
}

export default function AdminReportsPage() {
  const { user } = useAuth()
  const isMarketing = user?.role === 'marketing' || user?.role === 'director_marketing'
  const orders = useQuery({ queryKey: ['admin', 'reportes', 'ordenes'], queryFn: () => getOrdenes(), enabled: !isMarketing })
  const popups = useQuery({ queryKey: ['admin', 'reportes', 'popups'], queryFn: () => fetchPopups(), enabled: isMarketing })
  if (isMarketing) {
    const columns: DataTableColumn<Popup>[] = [{ header: 'Texto', accessor: 'texto' }, { header: 'Estado', accessor: 'estado', render: (row) => <Badge value={row.estado} /> }, { header: 'Inicio', accessor: 'fecha_inicio' }, { header: 'Fin', accessor: 'fecha_fin' }]
    return <div className="space-y-6"><PageHeader title="Analítica de popups" subtitle="El backend actual no expone vistas ni clics; se muestra el inventario operativo." /><DataTable columns={columns} data={popups.data ?? []} isLoading={popups.isLoading} getRowKey={(row) => row.id} /></div>
  }
  const columns: DataTableColumn<OrdenPago>[] = [{ header: 'Alumno', accessor: 'alumno_id' }, { header: 'Monto', accessor: 'monto' }, { header: 'Medio', accessor: 'medio_pago' }, { header: 'Estado', accessor: 'estado', render: (row) => <Badge value={row.estado} /> }, { header: 'Fecha', accessor: 'created_at' }]
  return <div className="space-y-6"><PageHeader title="Exportar órdenes" subtitle="Descarga las órdenes disponibles como CSV." action={<button className="rounded-lg bg-[var(--admin-color-primary)] px-4 py-2 font-semibold text-white" onClick={() => downloadCsv((orders.data ?? []).map((order) => ({ id: order.id, alumno_id: order.alumno_id, monto: order.monto, medio_pago: order.medio_pago, estado: order.estado, created_at: order.created_at })), 'ordenes.csv')}>Exportar CSV</button>} /><DataTable columns={columns} data={orders.data ?? []} isLoading={orders.isLoading} getRowKey={(row) => row.id} /></div>
}
