import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { getOrdenes } from '../../api/ordenes'
import { getMatriculas } from '../../api/matriculas'
import { fetchProgramasPublicos } from '../../api/programsApi'
import type { OrdenPago, OrdenPagoEstado } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import type { DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { formatFecha, formatMonto } from '../../utils/format'

const ESTADOS: OrdenPagoEstado[] = ['pendiente', 'pagada', 'fallida', 'anulada', 'conciliada', 'pendiente_confirmacion']

const inputClass =
  'rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)]'

export default function PagosPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<OrdenPagoEstado | ''>('')
  const [detalle, setDetalle] = useState<OrdenPago | null>(null)

  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['portal', 'ordenes', { estado: estadoFiltro || undefined }],
    queryFn: () => getOrdenes(estadoFiltro ? { estado: estadoFiltro } : {}),
  })
  const { data: matriculas } = useQuery({ queryKey: ['portal', 'matriculas'], queryFn: getMatriculas })
  const { data: programas } = useQuery({ queryKey: ['portal', 'programas-publicos'], queryFn: fetchProgramasPublicos })

  // No hay endpoint de concepto accesible para un alumno: para las órdenes que vinieron
  // de una matrícula, reconstruimos la etiqueta vía matricula.orden_id → programa.
  const conceptoLabel = useMemo(() => {
    const map = new Map<string, string>()
    matriculas?.forEach((m) => {
      if (!m.orden_id) return
      const nombre = programas?.find((p) => p.id === m.programa_id)?.nombre
      map.set(m.orden_id, nombre ? `Matrícula: ${nombre}` : 'Matrícula')
    })
    return map
  }, [matriculas, programas])

  const columns: DataTableColumn<OrdenPago>[] = [
    { header: 'Concepto', accessor: 'concepto_id', render: (o) => conceptoLabel.get(o.id) ?? `Pago ${o.concepto_id.slice(0, 8)}…` },
    { header: 'Monto', accessor: 'monto', render: (o) => formatMonto(o.monto) },
    { header: 'Medio de pago', accessor: 'medio_pago', render: (o) => <span className="capitalize">{o.medio_pago}</span> },
    { header: 'Estado', accessor: 'estado', render: (o) => <Badge value={o.estado} /> },
    { header: 'Fecha', accessor: 'created_at', render: (o) => formatFecha(o.created_at) },
  ]

  return (
    <>
      <Helmet>
        <title>Mis Pagos - Portal - IDEMA</title>
      </Helmet>

      <PageHeader title="Mis Pagos" subtitle="Historial de órdenes de pago." />

      <div className="mb-4">
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as OrdenPagoEstado | '')}
          className={inputClass}
          style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado} className="capitalize">{estado}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={ordenes ?? []}
        isLoading={isLoading}
        emptyMessage="No hay órdenes para mostrar."
        getRowKey={(o) => o.id}
        onRowClick={(o) => setDetalle(o)}
      />

      <Modal isOpen={!!detalle} onClose={() => setDetalle(null)} title="Detalle de la orden" maxWidthClassName="max-w-md">
        {detalle && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Concepto</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>
                {conceptoLabel.get(detalle.id) ?? `Pago ${detalle.concepto_id.slice(0, 8)}…`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Monto</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{formatMonto(detalle.monto)}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Medio de pago</dt>
              <dd className="font-medium capitalize" style={{ color: 'var(--admin-color-text-primary)' }}>{detalle.medio_pago}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Estado</dt>
              <dd><Badge value={detalle.estado} /></dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Fecha de creación</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{formatFecha(detalle.created_at)}</dd>
            </div>
            {detalle.fecha_pago && (
              <div className="flex justify-between">
                <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Fecha de pago</dt>
                <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{formatFecha(detalle.fecha_pago)}</dd>
              </div>
            )}
            {detalle.voucher_url && (
              <div className="flex justify-between">
                <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Voucher</dt>
                <dd className="max-w-[60%] truncate font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{detalle.voucher_url}</dd>
              </div>
            )}
            {detalle.motivo_anulacion && (
              <div>
                <dt className="mb-1" style={{ color: 'var(--admin-color-text-secondary)' }}>Motivo de anulación</dt>
                <dd style={{ color: 'var(--admin-color-text-primary)' }}>{detalle.motivo_anulacion}</dd>
              </div>
            )}
          </dl>
        )}
      </Modal>
    </>
  )
}
