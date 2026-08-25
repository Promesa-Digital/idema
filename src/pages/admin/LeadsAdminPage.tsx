import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLeads, updateLeadEstado } from '../../api/leads'
import type { Lead } from '../../types'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import DetailModal from '../../components/ui/DetailModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { formatFecha } from '../../utils/format'

const LEADS_QUERY_KEY = ['admin', 'leads'] as const

export default function LeadsAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Lead | null>(null)
  const [paraDescartar, setParaDescartar] = useState<Lead | null>(null)

  const { data, isLoading, isError } = useQuery({ queryKey: LEADS_QUERY_KEY, queryFn: () => getLeads() })
  const leads = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY })

  const contactadoMutation = useMutation({
    mutationFn: (id: string) => updateLeadEstado(id, 'contactado'),
    onSuccess: () => {
      invalidate()
      setSelected(null)
      addToast('success', 'Lead actualizado', 'Se marcó como contactado.')
    },
    onError: () => addToast('error', 'No se pudo actualizar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const descartarMutation = useMutation({
    mutationFn: (id: string) => updateLeadEstado(id, 'descartado'),
    onSuccess: () => {
      invalidate()
      setParaDescartar(null)
      addToast('success', 'Lead descartado', 'El lead se marcó como descartado.')
    },
    onError: () => addToast('error', 'No se pudo descartar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Lead>[] = [
    { header: 'Nombre', accessor: 'nombre', render: (l) => l.nombre ?? '—' },
    { header: 'Correo', accessor: 'correo', render: (l) => l.correo ?? '—' },
    { header: 'Teléfono', accessor: 'telefono', render: (l) => l.telefono ?? '—' },
    { header: 'Origen', accessor: 'origen', render: (l) => <Badge value={l.origen} /> },
    { header: 'Estado', accessor: 'estado', render: (l) => <Badge value={l.estado} /> },
    { header: 'Fecha', accessor: 'created_at', render: (l) => formatFecha(l.created_at) },
  ]

  return (
    <>
      <Helmet>
        <title>Leads - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Leads" subtitle="Gestiona los contactos capturados desde el sitio público." />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar los leads. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoading}
          emptyMessage="No hay leads registrados."
          getRowKey={(l) => l.id}
          onRowClick={(l) => setSelected(l)}
        />
      )}

      {selected && (
        <DetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title="Detalle del lead"
          fields={[
            { label: 'Nombre', value: selected.nombre },
            { label: 'Correo', value: selected.correo },
            { label: 'Teléfono', value: selected.telefono },
            { label: 'Origen', value: selected.origen, type: 'badge' },
            { label: 'Estado', value: selected.estado, type: 'badge' },
            { label: 'Fecha', value: selected.created_at, type: 'date' },
          ]}
          actions={
            <>
              {selected.estado === 'nuevo' && (
                <Button variant="primary" onClick={() => contactadoMutation.mutate(selected.id)} disabled={contactadoMutation.isPending}>
                  {contactadoMutation.isPending ? 'Guardando...' : 'Marcar contactado'}
                </Button>
              )}
              {selected.estado !== 'descartado' && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setParaDescartar(selected)
                    setSelected(null)
                  }}
                >
                  Descartar
                </Button>
              )}
            </>
          }
        />
      )}

      <ConfirmModal
        isOpen={!!paraDescartar}
        title="Descartar lead"
        message="El lead se marcará como descartado y dejará de aparecer entre los pendientes de contactar."
        variant="destructive"
        confirmText="Descartar"
        isConfirming={descartarMutation.isPending}
        onCancel={() => setParaDescartar(null)}
        onConfirm={() => paraDescartar && descartarMutation.mutate(paraDescartar.id)}
      />
    </>
  )
}
