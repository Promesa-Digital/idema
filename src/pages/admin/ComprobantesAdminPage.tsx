import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getComprobantes, anularComprobante } from '../../api/comprobantes'
import type { Comprobante } from '../../types'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import DetailModal from '../../components/ui/DetailModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { formatFecha } from '../../utils/format'

const COMPROBANTES_QUERY_KEY = ['admin', 'comprobantes'] as const

export default function ComprobantesAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Comprobante | null>(null)
  const [paraAnular, setParaAnular] = useState<Comprobante | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: COMPROBANTES_QUERY_KEY, queryFn: getComprobantes })
  const comprobantes = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: COMPROBANTES_QUERY_KEY })

  const anularMutation = useMutation({
    mutationFn: (id: string) => anularComprobante(id, 'Anulación desde panel administrativo'),
    onSuccess: () => {
      invalidate()
      setParaAnular(null)
      addToast('success', 'Comprobante anulado', 'Se generó la nota de crédito correspondiente.')
    },
    onError: () => addToast('error', 'No se pudo anular', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Comprobante>[] = [
    { header: 'Tipo', accessor: 'tipo', render: (c) => <Badge value={c.tipo} /> },
    { header: 'Número', accessor: 'numero', render: (c) => c.numero ?? '—' },
    { header: 'Pagador', accessor: 'nombre_pagador' },
    { header: 'Estado', accessor: 'estado', render: (c) => <Badge value={c.estado} /> },
    { header: 'Fecha de emisión', accessor: 'fecha_emision', render: (c) => formatFecha(c.fecha_emision) },
  ]

  return (
    <>
      <Helmet>
        <title>Comprobantes - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Comprobantes" subtitle="Gestiona las boletas y facturas emitidas." />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar los comprobantes. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={comprobantes}
          isLoading={isLoading}
          emptyMessage="No hay comprobantes emitidos."
          getRowKey={(c) => c.id}
          onRowClick={(c) => setSelected(c)}
        />
      )}

      {selected && (
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle del comprobante"
          fields={[
            { label: 'Tipo', value: selected.tipo, type: 'badge' },
            { label: 'Número', value: selected.numero },
            { label: 'Pagador', value: selected.nombre_pagador },
            ...(selected.tipo === 'factura' ? [{ label: 'RUC', value: selected.ruc }] : []),
            { label: 'Estado', value: selected.estado, type: 'badge' as const },
            { label: 'Fecha de emisión', value: selected.fecha_emision, type: 'date' as const },
          ]}
          actions={
            selected.estado !== 'anulado' && (
              <Button
                variant="destructive"
                onClick={() => {
                  setParaAnular(selected)
                  setSelected(null)
                }}
              >
                Anular
              </Button>
            )
          }
        />
      )}

      <ConfirmModal
        isOpen={!!paraAnular}
        title="Anular comprobante"
        message="Se generará la nota de crédito correspondiente. Esta acción no se puede deshacer."
        variant="destructive"
        confirmText="Anular"
        isConfirming={anularMutation.isPending}
        onCancel={() => setParaAnular(null)}
        onConfirm={() => paraAnular && anularMutation.mutate(paraAnular.id)}
      />
    </>
  )
}
