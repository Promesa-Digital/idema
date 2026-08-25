import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrdenes, anularOrden, confirmarTransferencia } from '../../api/ordenes'
import { getCuentasAlumno } from '../../api/cuentasAlumno'
import { getConceptosCobro } from '../../api/conceptosCobro'
import type { OrdenPago } from '../../types'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import DetailModal from '../../components/ui/DetailModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { formatFecha, formatMonto } from '../../utils/format'

const ORDENES_QUERY_KEY = ['admin', 'ordenes'] as const

const CONCEPTO_TIPO_LABELS: Record<string, string> = {
  matricula: 'Matrícula', inscripcion: 'Inscripción', curso: 'Curso', pension: 'Pensión', gratuito: 'Gratuito',
}

export default function OrdenesAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<OrdenPago | null>(null)
  const [paraAnular, setParaAnular] = useState<OrdenPago | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: ORDENES_QUERY_KEY, queryFn: () => getOrdenes() })
  const ordenes = data ?? []

  // Referencias para mostrar nombre de alumno y descripción de concepto en vez de sus IDs crudos.
  const { data: cuentas } = useQuery({ queryKey: ['admin', 'cuentas-alumnos', 'ref'], queryFn: getCuentasAlumno })
  const { data: conceptos } = useQuery({ queryKey: ['admin', 'conceptos-cobro', 'ref'], queryFn: getConceptosCobro })

  const nombreAlumno = (alumnoId: string) => {
    const cuenta = cuentas?.find((c) => c.id === alumnoId)
    return cuenta ? `${cuenta.nombres} ${cuenta.apellidos}` : alumnoId
  }
  const nombreConcepto = (conceptoId: string) => {
    const concepto = conceptos?.find((c) => c.id === conceptoId)
    return concepto ? `${CONCEPTO_TIPO_LABELS[concepto.tipo] ?? concepto.tipo} — S/ ${concepto.monto}` : conceptoId
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ORDENES_QUERY_KEY })

  const confirmarMutation = useMutation({
    mutationFn: (id: string) => confirmarTransferencia(id),
    onSuccess: () => {
      invalidate()
      setSelected(null)
      addToast('success', 'Transferencia confirmada', 'La orden pasó a pagada.')
    },
    onError: () => addToast('error', 'No se pudo confirmar la transferencia', 'Inténtalo nuevamente en unos segundos.'),
  })

  const anularMutation = useMutation({
    mutationFn: (id: string) => anularOrden(id, 'Anulación desde panel administrativo'),
    onSuccess: () => {
      invalidate()
      setParaAnular(null)
      addToast('success', 'Orden anulada', 'La orden quedó registrada como anulada.')
    },
    onError: () => addToast('error', 'No se pudo anular', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<OrdenPago>[] = [
    { header: 'Alumno', accessor: 'alumno_id', render: (o) => nombreAlumno(o.alumno_id) },
    { header: 'Concepto', accessor: 'concepto_id', render: (o) => nombreConcepto(o.concepto_id) },
    { header: 'Monto', accessor: 'monto', render: (o) => formatMonto(o.monto) },
    { header: 'Medio de pago', accessor: 'medio_pago', render: (o) => <Badge value={o.medio_pago} /> },
    { header: 'Estado', accessor: 'estado', render: (o) => <Badge value={o.estado} /> },
    { header: 'Fecha', accessor: 'created_at', render: (o) => formatFecha(o.created_at) },
  ]

  return (
    <>
      <Helmet>
        <title>Órdenes - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Órdenes" subtitle="Gestiona las órdenes de pago de los alumnos." />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar las órdenes. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={ordenes}
          isLoading={isLoading}
          emptyMessage="No hay órdenes registradas."
          getRowKey={(o) => o.id}
          onRowClick={(o) => setSelected(o)}
        />
      )}

      {selected && (
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle de la orden"
          fields={[
            { label: 'Alumno', value: nombreAlumno(selected.alumno_id) },
            { label: 'Concepto', value: nombreConcepto(selected.concepto_id) },
            { label: 'Monto', value: selected.monto, type: 'money' },
            { label: 'Medio de pago', value: selected.medio_pago, type: 'badge' },
            { label: 'Estado', value: selected.estado, type: 'badge' },
            { label: 'Fecha de pago', value: selected.fecha_pago, type: 'date' },
            { label: 'Referencia Culqi', value: selected.ref_culqi, type: 'readonly' },
          ]}
          actions={
            <>
              {selected.estado === 'pendiente_confirmacion' && (
                <Button variant="primary" onClick={() => confirmarMutation.mutate(selected.id)} disabled={confirmarMutation.isPending}>
                  {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar transferencia'}
                </Button>
              )}
              {selected.estado !== 'anulada' && selected.estado !== 'conciliada' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setParaAnular(selected)
                    setSelected(null)
                  }}
                >
                  Anular
                </Button>
              )}
            </>
          }
        />
      )}

      <ConfirmModal
        isOpen={!!paraAnular}
        title="Anular orden"
        message="Esta acción no genera reembolso según la política de IDEMA. La orden quedará registrada como anulada."
        variant="destructive"
        confirmText="Anular"
        isConfirming={anularMutation.isPending}
        onCancel={() => setParaAnular(null)}
        onConfirm={() => paraAnular && anularMutation.mutate(paraAnular.id)}
      />
    </>
  )
}
