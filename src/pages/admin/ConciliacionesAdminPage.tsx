import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConciliaciones, getConciliacion, createConciliacion, cerrarConciliacion } from '../../api/conciliaciones'
import type { Conciliacion } from '../../types'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import DetailModal from '../../components/ui/DetailModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import { useToast } from '../../hooks/useToast'
import { formatFecha, formatMonto } from '../../utils/format'

const CONCILIACIONES_QUERY_KEY = ['admin', 'conciliaciones'] as const

function OrdenesDeConciliacion({ conciliacionId }: { conciliacionId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'conciliaciones', conciliacionId],
    queryFn: () => getConciliacion(conciliacionId),
  })

  if (isLoading) return <p className="text-sm text-[var(--color-text-tertiary)]">Cargando órdenes...</p>
  if (!data || data.ordenes.length === 0) return <p className="text-sm text-[var(--color-text-tertiary)]">No hay órdenes vinculadas a este periodo.</p>

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
        Órdenes incluidas ({data.ordenes.length})
      </h3>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {data.ordenes.map((o) => (
          <div key={o.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2">
            <span className="font-mono text-xs text-[var(--color-text-secondary)]">{o.orden_id.slice(0, 8)}</span>
            <div className="flex items-center gap-3">
              {o.diferencia && <span className="text-xs text-[var(--color-text-tertiary)]">Dif. {formatMonto(o.diferencia)}</span>}
              <Badge value={o.conciliada ? 'conciliada' : 'pendiente'} label={o.conciliada ? 'Conciliada' : 'Pendiente'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConciliacionesAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Conciliacion | null>(null)
  const [paraCerrar, setParaCerrar] = useState<Conciliacion | null>(null)
  const [mostrarNueva, setMostrarNueva] = useState(false)

  const { data, isLoading, isError } = useQuery({ queryKey: CONCILIACIONES_QUERY_KEY, queryFn: getConciliaciones })
  const conciliaciones = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CONCILIACIONES_QUERY_KEY })

  const cerrarMutation = useMutation({
    mutationFn: (id: string) => cerrarConciliacion(id),
    onSuccess: () => {
      invalidate()
      setParaCerrar(null)
      addToast('success', 'Conciliación cerrada', 'Ya no podrá editarse.')
    },
    onError: () => addToast('error', 'No se pudo cerrar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Conciliacion>[] = [
    { header: 'Periodo inicio', accessor: 'periodo_inicio', render: (c) => formatFecha(c.periodo_inicio) },
    { header: 'Periodo fin', accessor: 'periodo_fin', render: (c) => formatFecha(c.periodo_fin) },
    { header: 'Monto esperado', accessor: 'monto_esperado', render: (c) => formatMonto(c.monto_esperado) },
    { header: 'Monto abonado', accessor: 'monto_abonado', render: (c) => formatMonto(c.monto_abonado) },
    { header: 'Estado', accessor: 'estado', render: (c) => <Badge value={c.estado} /> },
  ]

  return (
    <>
      <Helmet>
        <title>Conciliaciones - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader
        title="Conciliaciones"
        subtitle="Concilia los pagos recibidos contra las órdenes del periodo."
        action={<Button variant="primary" onClick={() => setMostrarNueva(true)}>Nueva conciliación</Button>}
      />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar las conciliaciones. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={conciliaciones}
          isLoading={isLoading}
          emptyMessage="No hay conciliaciones registradas."
          getRowKey={(c) => c.id}
          onRowClick={(c) => setSelected(c)}
        />
      )}

      {selected && (
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle de la conciliación"
          fields={[
            { label: 'Periodo inicio', value: selected.periodo_inicio, type: 'date' },
            { label: 'Periodo fin', value: selected.periodo_fin, type: 'date' },
            { label: 'Monto esperado', value: selected.monto_esperado, type: 'money' },
            { label: 'Monto abonado', value: selected.monto_abonado, type: 'money' },
            { label: 'Comisión', value: selected.comision, type: 'money' },
            { label: 'Estado', value: selected.estado, type: 'badge' },
          ]}
          actions={
            selected.estado !== 'cerrada' && (
              <Button
                variant="destructive"
                onClick={() => {
                  setParaCerrar(selected)
                  setSelected(null)
                }}
              >
                Cerrar conciliación
              </Button>
            )
          }
        >
          <OrdenesDeConciliacion conciliacionId={selected.id} />
        </DetailModal>
      )}

      <ConfirmModal
        isOpen={!!paraCerrar}
        title="Cerrar conciliación"
        message="Ya no podrá editarse ni conciliar más órdenes en este periodo después de cerrada."
        variant="destructive"
        confirmText="Cerrar"
        isConfirming={cerrarMutation.isPending}
        onCancel={() => setParaCerrar(null)}
        onConfirm={() => paraCerrar && cerrarMutation.mutate(paraCerrar.id)}
      />

      <NuevaConciliacionModal isOpen={mostrarNueva} onClose={() => setMostrarNueva(false)} onDone={invalidate} />
    </>
  )
}

function NuevaConciliacionModal({ isOpen, onClose, onDone }: { isOpen: boolean; onClose: () => void; onDone: () => void }) {
  const { addToast } = useToast()
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createConciliacion({ periodo_inicio: periodoInicio, periodo_fin: periodoFin }),
    onSuccess: () => {
      addToast('success', 'Conciliación creada', 'Se tomaron automáticamente las órdenes pagadas del periodo.')
      setPeriodoInicio('')
      setPeriodoFin('')
      onDone()
      onClose()
    },
    onError: () => setError('No se pudo crear la conciliación. Revisa las fechas e inténtalo nuevamente.'),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva conciliación">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mutation.mutate()
        }}
      >
        {error && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{error}</p>}
        <FormInput label="Periodo inicio" type="date" value={periodoInicio} onChange={setPeriodoInicio} required />
        <FormInput label="Periodo fin" type="date" value={periodoFin} onChange={setPeriodoFin} required />
        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando...' : 'Crear conciliación'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
