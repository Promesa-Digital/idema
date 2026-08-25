import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCuentasAlumno, darDeBajaCuenta, reactivarCuenta } from '../../api/cuentasAlumno'
import { getMatriculasDeAlumno } from '../../api/matriculas'
import { getOrdenes } from '../../api/ordenes'
import type { CuentaAlumno } from '../../types'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import DetailModal from '../../components/ui/DetailModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { formatFecha, formatMonto } from '../../utils/format'

const CUENTAS_QUERY_KEY = ['admin', 'cuentas-alumnos'] as const

function HistorialAlumno({ alumnoId }: { alumnoId: string }) {
  const { data: matriculas, isLoading: loadingMatriculas } = useQuery({
    queryKey: ['admin', 'matriculas', 'de-alumno', alumnoId],
    queryFn: () => getMatriculasDeAlumno(alumnoId),
  })
  const { data: ordenes, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['admin', 'ordenes', 'de-alumno', alumnoId],
    queryFn: () => getOrdenes({ alumno_id: alumnoId }),
  })

  const ultimasMatriculas = (matriculas ?? []).slice(0, 5)
  const ultimasOrdenes = (ordenes ?? []).slice(0, 5)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Últimas matrículas
        </h3>
        {loadingMatriculas && <p className="text-sm text-[var(--color-text-tertiary)]">Cargando...</p>}
        {!loadingMatriculas && ultimasMatriculas.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Sin matrículas registradas.</p>}
        {!loadingMatriculas && ultimasMatriculas.length > 0 && (
          <div className="space-y-2">
            {ultimasMatriculas.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm">
                <span className="capitalize text-[var(--color-text-main)]">{m.tipo}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-tertiary)]">{formatFecha(m.created_at)}</span>
                  <Badge value={m.estado} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Últimas órdenes
        </h3>
        {loadingOrdenes && <p className="text-sm text-[var(--color-text-tertiary)]">Cargando...</p>}
        {!loadingOrdenes && ultimasOrdenes.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">Sin órdenes registradas.</p>}
        {!loadingOrdenes && ultimasOrdenes.length > 0 && (
          <div className="space-y-2">
            {ultimasOrdenes.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm">
                <span className="text-[var(--color-text-main)]">{formatMonto(o.monto)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-tertiary)]">{formatFecha(o.created_at)}</span>
                  <Badge value={o.estado} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CuentasAlumnosAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<CuentaAlumno | null>(null)
  const [paraDarDeBaja, setParaDarDeBaja] = useState<CuentaAlumno | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: CUENTAS_QUERY_KEY, queryFn: getCuentasAlumno })
  const cuentas = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CUENTAS_QUERY_KEY })

  const darDeBajaMutation = useMutation({
    mutationFn: (id: string) => darDeBajaCuenta(id),
    onSuccess: () => {
      invalidate()
      setParaDarDeBaja(null)
      addToast('success', 'Cuenta dada de baja', 'El alumno perdió acceso al portal académico.')
    },
    onError: () => addToast('error', 'No se pudo dar de baja', 'Inténtalo nuevamente en unos segundos.'),
  })

  const reactivarMutation = useMutation({
    mutationFn: (id: string) => reactivarCuenta(id),
    onSuccess: () => {
      invalidate()
      setSelected(null)
      addToast('success', 'Cuenta reactivada', 'El alumno recuperó el acceso al portal académico.')
    },
    onError: () => addToast('error', 'No se pudo reactivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<CuentaAlumno>[] = [
    { header: 'Nombres', accessor: 'nombres' },
    { header: 'Apellidos', accessor: 'apellidos' },
    { header: 'DNI', accessor: 'dni' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Teléfono', accessor: 'telefono' },
    { header: 'Estado', accessor: 'estado', render: (c) => <Badge value={c.estado} /> },
  ]

  return (
    <>
      <Helmet>
        <title>Cuentas de alumnos - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Cuentas de alumnos" subtitle="Consulta y administra las cuentas del portal académico." />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar las cuentas. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={cuentas}
          isLoading={isLoading}
          emptyMessage="No hay cuentas de alumnos registradas."
          getRowKey={(c) => c.id}
          onRowClick={(c) => setSelected(c)}
        />
      )}

      {selected && (
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle de la cuenta"
          fields={[
            { label: 'Nombres', value: selected.nombres },
            { label: 'Apellidos', value: selected.apellidos },
            { label: 'DNI', value: selected.dni },
            { label: 'Correo', value: selected.correo },
            { label: 'Teléfono', value: selected.telefono },
            { label: 'Estado', value: selected.estado, type: 'badge' },
            { label: 'Fecha de registro', value: selected.created_at, type: 'date' },
          ]}
          actions={
            selected.estado === 'activa' ? (
              <Button
                variant="destructive"
                onClick={() => {
                  setParaDarDeBaja(selected)
                  setSelected(null)
                }}
              >
                Dar de baja
              </Button>
            ) : (
              <Button variant="primary" onClick={() => reactivarMutation.mutate(selected.id)} disabled={reactivarMutation.isPending}>
                {reactivarMutation.isPending ? 'Reactivando...' : 'Reactivar'}
              </Button>
            )
          }
        >
          <HistorialAlumno alumnoId={selected.id} />
        </DetailModal>
      )}

      <ConfirmModal
        isOpen={!!paraDarDeBaja}
        title="Dar de baja la cuenta"
        message="El alumno perderá acceso al portal académico. Esta acción conserva su historial y puede revertirse desde esta misma pantalla."
        variant="destructive"
        confirmText="Dar de baja"
        isConfirming={darDeBajaMutation.isPending}
        onCancel={() => setParaDarDeBaja(null)}
        onConfirm={() => paraDarDeBaja && darDeBajaMutation.mutate(paraDarDeBaja.id)}
      />
    </>
  )
}
