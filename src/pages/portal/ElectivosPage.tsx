import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FiPlus } from 'react-icons/fi'
import { getElectivos, activarElectivo, desactivarElectivo } from '../../api/electivos'
import { getMatriculas } from '../../api/matriculas'
import { fetchProgramasPublicos } from '../../api/programsApi'
import type { Electivo } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import type { DataTableColumn } from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../hooks/useToast'
import { formatFecha } from '../../utils/format'

// Mismo tope que app/crud/electivo.py::LIMITE_ANUAL_POR_TIPO_PROGRAMA — en carrera no hay límite.
const LIMITE_ANUAL: Record<string, number> = { especializacion: 1, auxiliar: 2, carrera: 2 }

const cardClass =
  'rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)]'
const inputClass =
  'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)]'

function ActivarElectivoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [matriculaId, setMatriculaId] = useState('')
  const [programaId, setProgramaId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: matriculas } = useQuery({ queryKey: ['portal', 'matriculas'], queryFn: getMatriculas, enabled: isOpen })
  const { data: programas, isLoading: loadingProgramas } = useQuery({
    queryKey: ['portal', 'programas-publicos'],
    queryFn: fetchProgramasPublicos,
    enabled: isOpen,
  })
  const { data: electivos } = useQuery({ queryKey: ['portal', 'electivos'], queryFn: getElectivos, enabled: isOpen })

  const matriculasActivas = matriculas?.filter((m) => m.estado === 'activa') ?? []
  const cursosDisponibles = (programas ?? []).filter((p) => p.tipo === 'curso')
  const yaActivados = new Set((electivos ?? []).filter((e) => e.estado !== 'cancelado').map((e) => e.programa_id))

  const mutation = useMutation({
    // gratuito siempre en false desde el portal: es el sistema, no el alumno, quien
    // debería decidir qué curso es gratuito (transversal) — no hay un flag confiable
    // para eso en Programa todavía, así que no se lo dejamos elegir al alumno.
    mutationFn: () => activarElectivo({ matricula_id: matriculaId, programa_id: programaId, gratuito: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'electivos'] })
      addToast('success', 'Electivo activado', 'El curso quedó activado en tu cuenta.')
      handleClose()
    },
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 422) {
        setError(err.response.data?.detail ?? 'Alcanzaste el límite anual de electivos para tu programa.')
      } else if (isAxiosError(err) && err.response?.status === 409) {
        setError('Tu matrícula debe estar activa para activar electivos.')
      } else {
        setError('No se pudo activar el electivo. Intenta nuevamente.')
      }
    },
  })

  const handleClose = () => {
    setMatriculaId('')
    setProgramaId('')
    setError(null)
    onClose()
  }

  const handleSubmit = () => {
    setError(null)
    if (!matriculaId) return setError('Selecciona la matrícula base.')
    if (!programaId) return setError('Selecciona un curso.')
    mutation.mutate()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Activar electivo">
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Matrícula</label>
          <select value={matriculaId} onChange={(e) => setMatriculaId(e.target.value)} className={inputClass}
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}>
            <option value="">Selecciona tu matrícula activa</option>
            {matriculasActivas.map((m) => (
              <option key={m.id} value={m.id}>{m.id.slice(0, 8)}… — {m.tipo}</option>
            ))}
          </select>
          {matriculasActivas.length === 0 && (
            <p className="mt-1.5 text-xs text-red-600">No tienes ninguna matrícula activa todavía.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Curso electivo</label>
          {loadingProgramas ? (
            <p className="text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando cursos...</p>
          ) : (
            <select value={programaId} onChange={(e) => setProgramaId(e.target.value)} className={inputClass}
              style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}>
              <option value="">Selecciona un curso</option>
              {cursosDisponibles.map((p) => (
                <option key={p.id} value={p.id} disabled={yaActivados.has(p.id)}>
                  {p.nombre} {yaActivados.has(p.id) ? '(ya activado)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose} className="rounded-lg border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={mutation.isPending}
            className="rounded-lg bg-[var(--admin-color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] disabled:opacity-60">
            {mutation.isPending ? 'Activando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ElectivosPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [isActivarOpen, setIsActivarOpen] = useState(false)
  const [aDesactivar, setADesactivar] = useState<Electivo | null>(null)

  const { data: electivos, isLoading } = useQuery({ queryKey: ['portal', 'electivos'], queryFn: getElectivos })
  const { data: matriculas } = useQuery({ queryKey: ['portal', 'matriculas'], queryFn: getMatriculas })
  const { data: programas } = useQuery({ queryKey: ['portal', 'programas-publicos'], queryFn: fetchProgramasPublicos })

  const programaMap = useMemo(() => {
    const map = new Map<string, string>()
    programas?.forEach((p) => map.set(p.id, p.nombre))
    return map
  }, [programas])

  const cupos = useMemo(() => {
    const matriculaActiva = matriculas?.find((m) => m.estado === 'activa')
    if (!matriculaActiva) return null
    const programaBase = programas?.find((p) => p.id === matriculaActiva.programa_id)
    if (!programaBase) return null
    if (programaBase.tipo === 'carrera') return { limite: Infinity, usados: 0 }
    const limite = LIMITE_ANUAL[programaBase.tipo]
    if (limite === undefined) return null
    const anioActual = new Date().getFullYear()
    const usados = (electivos ?? []).filter(
      (e) => e.estado !== 'cancelado' && new Date(e.fecha_activacion).getFullYear() === anioActual,
    ).length
    return { limite, usados }
  }, [matriculas, programas, electivos])

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => desactivarElectivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'electivos'] })
      addToast('success', 'Electivo retirado', 'Se liberó el cupo del año.')
      setADesactivar(null)
    },
    onError: () => addToast('error', 'No se pudo retirar', 'Intenta nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Electivo>[] = [
    { header: 'Curso', accessor: 'programa_id', render: (e) => programaMap.get(e.programa_id) ?? e.programa_id },
    { header: 'Estado', accessor: 'estado', render: (e) => <Badge value={e.estado} /> },
    { header: 'Gratuito', accessor: 'gratuito', render: (e) => (e.gratuito ? 'Sí' : 'No') },
    { header: 'Fecha activación', accessor: 'fecha_activacion', render: (e) => formatFecha(e.fecha_activacion) },
    {
      header: 'Acción',
      accessor: 'id',
      render: (e) =>
        e.estado === 'activado' ? (
          <button
            type="button"
            onClick={() => setADesactivar(e)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Desactivar
          </button>
        ) : null,
    },
  ]

  return (
    <>
      <Helmet>
        <title>Mis Electivos - Portal - IDEMA</title>
      </Helmet>

      <PageHeader
        title="Mis Electivos"
        subtitle="Cursos electivos activados sobre tu programa."
        action={
          <button
            type="button"
            onClick={() => setIsActivarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)]"
          >
            <FiPlus /> Activar electivo
          </button>
        }
      />

      <div className={`${cardClass} mb-6 max-w-xs`} style={{ borderColor: 'var(--admin-color-border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--admin-color-text-secondary)' }}>Cupos restantes este año</p>
        <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
          {cupos === null
            ? '—'
            : cupos.limite === Infinity
              ? 'Sin límite'
              : Math.max(0, cupos.limite - cupos.usados)}
        </p>
        {cupos && cupos.limite !== Infinity && (
          <p className="mt-1 text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>
            {cupos.usados} de {cupos.limite} usados
          </p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={electivos ?? []}
        isLoading={isLoading}
        emptyMessage="Todavía no activaste ningún electivo."
        getRowKey={(e) => e.id}
      />

      <ActivarElectivoModal isOpen={isActivarOpen} onClose={() => setIsActivarOpen(false)} />

      <ConfirmModal
        isOpen={!!aDesactivar}
        title="Desactivar electivo"
        message="Vas a retirar este curso electivo. Se liberará el cupo del año para activar otro."
        confirmText="Sí, desactivar"
        isConfirming={desactivarMutation.isPending}
        onCancel={() => setADesactivar(null)}
        onConfirm={() => aDesactivar && desactivarMutation.mutate(aDesactivar.id)}
      />
    </>
  )
}
