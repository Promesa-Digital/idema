import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { FiPlus, FiEye } from 'react-icons/fi'
import { getMatriculas, createMatricula, anularMatricula } from '../../api/matriculas'
import { fetchProgramasPublicos } from '../../api/programsApi'
import type { Matricula } from '../../types'
import type { OrdenPagoMedioPago } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import type { DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../hooks/useToast'
import { formatFecha } from '../../utils/format'

const TIPO_LABELS: Record<Matricula['tipo'], string> = { nueva: 'Nueva', retorno: 'Retorno' }
const MOTIVO_ANULACION_ALUMNO = 'Solicitado por el alumno desde el portal'

const inputClass =
  'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)]'

function NuevaMatriculaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [programaId, setProgramaId] = useState('')
  const [medioPago, setMedioPago] = useState<OrdenPagoMedioPago>('transferencia')
  const [tokenCulqi, setTokenCulqi] = useState('')
  const [voucherUrl, setVoucherUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: programas, isLoading: loadingProgramas } = useQuery({
    queryKey: ['portal', 'programas-publicos'],
    queryFn: fetchProgramasPublicos,
    enabled: isOpen,
  })

  const mutation = useMutation({
    mutationFn: createMatricula,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'matriculas'] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'ordenes'] })
      addToast('success', 'Matrícula creada', 'Tu matrícula quedó pendiente de pago.')
      const programaNombre = programas?.find((p) => p.id === data.programa_id)?.nombre
      handleClose()
      if (data.orden_id) {
        navigate(`/portal/checkout?orden_id=${data.orden_id}`, { state: { programaNombre } })
      }
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 422) {
        setError(err.response.data?.detail ?? 'El programa no tiene un concepto de matrícula activo.')
      } else {
        setError('No se pudo crear la matrícula. Intenta nuevamente.')
      }
    },
  })

  const handleClose = () => {
    setProgramaId('')
    setMedioPago('transferencia')
    setTokenCulqi('')
    setVoucherUrl('')
    setError(null)
    onClose()
  }

  const handleSubmit = () => {
    setError(null)
    if (!programaId) {
      setError('Selecciona un programa.')
      return
    }
    if ((medioPago === 'tarjeta' || medioPago === 'yape') && !tokenCulqi.trim()) {
      setError('Ingresa el token de pago.')
      return
    }
    if (medioPago === 'transferencia' && !voucherUrl.trim()) {
      setError('Ingresa la URL del voucher de transferencia.')
      return
    }
    mutation.mutate({
      programa_id: programaId,
      medio_pago: medioPago,
      token_culqi: medioPago !== 'transferencia' ? tokenCulqi.trim() : undefined,
      voucher_url: medioPago === 'transferencia' ? voucherUrl.trim() : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva matrícula">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
            Programa
          </label>
          {loadingProgramas ? (
            <p className="text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando programas...</p>
          ) : (
            <select
              value={programaId}
              onChange={(e) => setProgramaId(e.target.value)}
              className={inputClass}
              style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
            >
              <option value="">Selecciona un programa</option>
              {programas?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.codigo})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
            Medio de pago
          </label>
          <div className="flex gap-2">
            {(['transferencia', 'tarjeta', 'yape'] as OrdenPagoMedioPago[]).map((medio) => (
              <button
                key={medio}
                type="button"
                onClick={() => setMedioPago(medio)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors"
                style={
                  medioPago === medio
                    ? { borderColor: 'var(--admin-color-primary)', backgroundColor: 'var(--admin-color-highlight)', color: 'var(--admin-color-primary)' }
                    : { borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }
                }
              >
                {medio}
              </button>
            ))}
          </div>
        </div>

        {medioPago === 'transferencia' ? (
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
              URL del voucher
            </label>
            <input
              type="text"
              value={voucherUrl}
              onChange={(e) => setVoucherUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
              style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
              Token de pago (Culqi)
            </label>
            <input
              type="text"
              value={tokenCulqi}
              onChange={(e) => setTokenCulqi(e.target.value)}
              placeholder="tok_..."
              className={inputClass}
              style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="rounded-lg bg-[var(--admin-color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] disabled:opacity-60"
          >
            {mutation.isPending ? 'Creando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function MatriculasPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [isNuevaOpen, setIsNuevaOpen] = useState(false)
  const [detalle, setDetalle] = useState<Matricula | null>(null)
  const [aAnular, setAAnular] = useState<Matricula | null>(null)

  const { data: matriculas, isLoading } = useQuery({
    queryKey: ['portal', 'matriculas'],
    queryFn: getMatriculas,
  })
  const { data: programas } = useQuery({
    queryKey: ['portal', 'programas-publicos'],
    queryFn: fetchProgramasPublicos,
  })

  const programaMap = useMemo(() => {
    const map = new Map<string, string>()
    programas?.forEach((p) => map.set(p.id, p.nombre))
    return map
  }, [programas])

  const anularMutation = useMutation({
    mutationFn: (m: Matricula) => anularMatricula(m.id, MOTIVO_ANULACION_ALUMNO),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'matriculas'] })
      addToast('success', 'Anulación solicitada', 'Tu matrícula fue anulada.')
      setAAnular(null)
    },
    onError: () => {
      addToast('error', 'No se pudo anular', 'Intenta nuevamente en unos segundos.')
    },
  })

  const columns: DataTableColumn<Matricula>[] = [
    { header: 'Programa', accessor: 'programa_id', render: (m) => programaMap.get(m.programa_id) ?? m.programa_id },
    { header: 'Tipo', accessor: 'tipo', render: (m) => TIPO_LABELS[m.tipo] },
    { header: 'Estado', accessor: 'estado', render: (m) => <Badge value={m.estado} /> },
    { header: 'Fecha', accessor: 'created_at', render: (m) => formatFecha(m.created_at) },
    {
      header: 'Acción',
      accessor: 'id',
      render: (m) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDetalle(m)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--admin-color-bg)]"
            style={{ color: 'var(--admin-color-primary)' }}
          >
            <FiEye /> Ver detalle
          </button>
          {m.estado === 'activa' && (
            <button
              type="button"
              onClick={() => setAAnular(m)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Solicitar anulación
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Mis Matrículas - Portal - IDEMA</title>
      </Helmet>

      <PageHeader
        title="Mis Matrículas"
        subtitle="Programas en los que estás matriculado y su estado."
        action={
          <button
            type="button"
            onClick={() => setIsNuevaOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)]"
          >
            <FiPlus /> Nueva matrícula
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={matriculas ?? []}
        isLoading={isLoading}
        emptyMessage="Todavía no tienes matrículas registradas."
        getRowKey={(m) => m.id}
      />

      <NuevaMatriculaModal isOpen={isNuevaOpen} onClose={() => setIsNuevaOpen(false)} />

      <Modal isOpen={!!detalle} onClose={() => setDetalle(null)} title="Detalle de matrícula" maxWidthClassName="max-w-md">
        {detalle && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Programa</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>
                {programaMap.get(detalle.programa_id) ?? detalle.programa_id}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Tipo</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{TIPO_LABELS[detalle.tipo]}</dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Estado</dt>
              <dd><Badge value={detalle.estado} /></dd>
            </div>
            <div className="flex justify-between">
              <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Fecha de registro</dt>
              <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{formatFecha(detalle.created_at)}</dd>
            </div>
            {detalle.fecha_activacion && (
              <div className="flex justify-between">
                <dt style={{ color: 'var(--admin-color-text-secondary)' }}>Fecha de activación</dt>
                <dd className="font-medium" style={{ color: 'var(--admin-color-text-primary)' }}>{formatFecha(detalle.fecha_activacion)}</dd>
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

      <ConfirmModal
        isOpen={!!aAnular}
        title="Solicitar anulación de matrícula"
        message="Esta acción anula tu matrícula y no genera reembolso de los pagos ya realizados. ¿Deseas continuar?"
        variant="destructive"
        confirmLabel="Sí, anular"
        isConfirming={anularMutation.isPending}
        onCancel={() => setAAnular(null)}
        onConfirm={() => aAnular && anularMutation.mutate(aAnular)}
      />
    </>
  )
}
