import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiSend, FiCheck, FiX, FiPlay, FiFlag } from 'react-icons/fi'
import { fetchPopups, enviarAprobacionPopup, aprobarPopup, rechazarPopup, publicarPopup, finalizarPopup } from '../../api/adminPopupsApi'
import { POPUP_ESTADO_LABELS, type Popup, type PopupEstado } from '../../types/admin'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import { VARIANT_CLASSES, iconButtonClasses } from '../../components/ui/buttonVariants'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'

const POPUPS_QUERY_KEY = ['admin', 'popups'] as const

export default function PopupsAdminPage() {
  const [estado, setEstado] = useState<PopupEstado | ''>('')
  const { user } = useAuth()
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const filters = estado ? { estado } : {}

  const { data, isLoading, isError } = useQuery({
    queryKey: [...POPUPS_QUERY_KEY, filters],
    queryFn: () => fetchPopups(filters),
  })
  const popups = Array.isArray(data) ? data : []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: POPUPS_QUERY_KEY })

  const enviarMutation = useMutation({
    mutationFn: enviarAprobacionPopup,
    onSuccess: () => {
      invalidate()
      addToast('success', 'Enviado a aprobación', 'El popup quedó pendiente de revisión.')
    },
    onError: () => addToast('error', 'No se pudo enviar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const aprobarMutation = useMutation({
    mutationFn: aprobarPopup,
    onSuccess: () => {
      invalidate()
      addToast('success', 'Popup aprobado', 'El popup ya puede publicarse.')
    },
    onError: () => addToast('error', 'No se pudo aprobar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const rechazarMutation = useMutation({
    mutationFn: rechazarPopup,
    onSuccess: () => {
      invalidate()
      addToast('success', 'Popup rechazado', 'Se notificó al equipo para que lo ajuste.')
    },
    onError: () => addToast('error', 'No se pudo rechazar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const publicarMutation = useMutation({ mutationFn: publicarPopup, onSuccess: () => { invalidate(); addToast('success', 'Popup publicado', 'El popup está activo.') } })
  const finalizarMutation = useMutation({ mutationFn: finalizarPopup, onSuccess: () => { invalidate(); addToast('success', 'Popup finalizado', 'El popup dejó de estar activo.') } })

  const isPending = enviarMutation.isPending || aprobarMutation.isPending || rechazarMutation.isPending || publicarMutation.isPending || finalizarMutation.isPending

  const columns: DataTableColumn<Popup>[] = [
    {
      header: 'Popup',
      accessor: 'texto',
      render: (popup) => (
        <div className="flex items-center gap-3">
          <img
            src={popup.imagen_url}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-[var(--radius-sm)] object-cover bg-[var(--color-bg-page)]"
          />
          <span className="max-w-xs text-[var(--color-text-main)]">{popup.texto}</span>
        </div>
      ),
    },
    {
      header: 'Vigencia',
      accessor: 'fecha_inicio',
      render: (popup) => `${popup.fecha_inicio} → ${popup.fecha_fin}`,
    },
    {
      header: 'Estado',
      accessor: 'estado',
      render: (popup) => <Badge value={popup.estado} />,
    },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (popup) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link to={`/admin/popups/${popup.id}/editar`} className={iconButtonClasses('ghost')} title="Editar">
            <FiEdit2 />
          </Link>

          {(popup.estado === 'borrador' || popup.estado === 'rechazado') && (
            <button
              type="button"
              onClick={() => enviarMutation.mutate(popup.id)}
              disabled={isPending}
              className={iconButtonClasses('ghost')}
              title="Enviar a aprobación"
            >
              <FiSend />
            </button>
          )}

          {popup.estado === 'pendiente' && user?.role === 'director_marketing' && (
            <>
              <button
                type="button"
                onClick={() => aprobarMutation.mutate(popup.id)}
                disabled={isPending}
                className={iconButtonClasses('primary')}
                title="Aprobar"
              >
                <FiCheck />
              </button>
              <button
                type="button"
                onClick={() => rechazarMutation.mutate(popup.id)}
                disabled={isPending}
                className={iconButtonClasses('destructive')}
                title="Rechazar"
              >
                <FiX />
              </button>
            </>
          )}
          {popup.estado === 'aprobado' && user?.role === 'director_marketing' && (
            <button
              type="button"
              onClick={() => publicarMutation.mutate(popup.id)}
              disabled={isPending}
              className={iconButtonClasses('outlined')}
              title="Publicar"
            >
              <FiPlay />
            </button>
          )}
          {popup.estado === 'publicado' && user?.role === 'director_marketing' && (
            <button
              type="button"
              onClick={() => finalizarMutation.mutate(popup.id)}
              disabled={isPending}
              className={iconButtonClasses('ghost')}
              title="Finalizar"
            >
              <FiFlag />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Popups - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader
        title="Popups"
        subtitle="Gestiona los anuncios full-screen y su flujo de aprobación."
        action={
          <Link
            to="/admin/popups/nuevo"
            className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${VARIANT_CLASSES.primary}`}
          >
            <FiPlus /> Nuevo popup
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as PopupEstado | '')}
          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-main)] transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(POPUP_ESTADO_LABELS) as PopupEstado[]).map((key) => (
            <option key={key} value={key}>{POPUP_ESTADO_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar los popups. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={popups}
          isLoading={isLoading}
          emptyMessage="No hay popups que coincidan con los filtros."
          getRowKey={(popup) => popup.id}
        />
      )}
    </>
  )
}
