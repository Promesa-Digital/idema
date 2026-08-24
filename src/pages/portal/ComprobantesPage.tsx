import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { FiDownload } from 'react-icons/fi'
import { getComprobantes } from '../../api/comprobantes'
import type { Comprobante } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import type { DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { formatFecha } from '../../utils/format'

const TIPO_LABELS: Record<Comprobante['tipo'], string> = { boleta: 'Boleta', factura: 'Factura' }

export default function ComprobantesPage() {
  const { addToast } = useToast()

  const { data: comprobantes, isLoading } = useQuery({
    queryKey: ['portal', 'comprobantes'],
    queryFn: getComprobantes,
  })

  const columns: DataTableColumn<Comprobante>[] = [
    { header: 'Tipo', accessor: 'tipo', render: (c) => TIPO_LABELS[c.tipo] },
    { header: 'Número', accessor: 'numero', render: (c) => c.numero ?? '—' },
    { header: 'Pagador', accessor: 'nombre_pagador' },
    { header: 'Estado', accessor: 'estado', render: (c) => <Badge value={c.estado} /> },
    { header: 'Fecha', accessor: 'fecha_emision', render: (c) => formatFecha(c.fecha_emision) },
    {
      header: 'Acción',
      accessor: 'id',
      render: (c) => (
        <button
          type="button"
          onClick={() => addToast('info', 'Comprobante', `ID: ${c.id}`)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--admin-color-bg)]"
          style={{ color: 'var(--admin-color-primary)' }}
        >
          <FiDownload /> Descargar
        </button>
      ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Mis Comprobantes - Portal - IDEMA</title>
      </Helmet>

      <PageHeader title="Mis Comprobantes" subtitle="Boletas y facturas emitidas para tus pagos." />

      <DataTable
        columns={columns}
        data={comprobantes ?? []}
        isLoading={isLoading}
        emptyMessage="Todavía no tienes comprobantes emitidos."
        getRowKey={(c) => c.id}
      />
    </>
  )
}
