import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiSend, FiCheck, FiX, FiPlay, FiFlag } from 'react-icons/fi'
import { fetchPopups, enviarAprobacionPopup, aprobarPopup, rechazarPopup, publicarPopup, finalizarPopup } from '../../api/adminPopupsApi'
import { POPUP_ESTADO_LABELS, type PopupEstado } from '../../types/admin'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'

const POPUPS_QUERY_KEY = ['admin', 'popups'] as const
const cardBorder = { borderColor: 'var(--admin-color-border)' }

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
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] whitespace-nowrap"
          >
            <FiPlus /> Nuevo popup
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as PopupEstado | '')}
          className="rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)] transition"
          style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(POPUP_ESTADO_LABELS) as PopupEstado[]).map((key) => (
            <option key={key} value={key}>{POPUP_ESTADO_LABELS[key]}</option>
          ))}
        </select>
      </div>

      <div
        className="overflow-hidden rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] shadow-[var(--admin-shadow-sm)]"
        style={cardBorder}
      >
        {isLoading && <p className="py-16 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando popups...</p>}

        {isError && <p className="py-16 text-center text-sm text-red-600">No se pudieron cargar los popups. Intenta de nuevo.</p>}

        {!isLoading && !isError && popups.length === 0 && (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>No hay popups que coincidan con los filtros.</p>
        )}

        {!isLoading && !isError && popups.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wide" style={{ ...cardBorder, color: 'var(--admin-color-text-secondary)' }}>
                  <th className="px-5 py-3">Popup</th>
                  <th className="px-5 py-3">Vigencia</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {popups.map((popup) => (
                  <tr key={popup.id} className="border-b align-top last:border-0" style={cardBorder}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={popup.imagen_url}
                          alt=""
                          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                          style={{ backgroundColor: 'var(--admin-color-bg)' }}
                        />
                        <span className="max-w-xs" style={{ color: 'var(--admin-color-text-primary)' }}>{popup.texto}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4" style={{ color: 'var(--admin-color-text-secondary)' }}>
                      {`${popup.fecha_inicio} → ${popup.fecha_fin}`}
                    </td>
                    <td className="px-5 py-4"><Badge value={popup.estado} /></td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/admin/popups/${popup.id}/editar`}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--admin-color-bg)]"
                          style={{ color: 'var(--admin-color-text-secondary)' }}
                          title="Editar"
                        >
                          <FiEdit2 />
                        </Link>

                        {(popup.estado === 'borrador' || popup.estado === 'rechazado') && (
                          <button
                            type="button"
                            onClick={() => enviarMutation.mutate(popup.id)}
                            disabled={isPending}
                            className="rounded-lg p-2 transition-colors hover:bg-[var(--admin-color-bg)] disabled:opacity-50"
                            style={{ color: 'var(--admin-color-primary)' }}
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
                              className="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                              title="Aprobar"
                            >
                              <FiCheck />
                            </button>
                            <button
                              type="button"
                              onClick={() => rechazarMutation.mutate(popup.id)}
                              disabled={isPending}
                              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                              title="Rechazar"
                            >
                              <FiX />
                            </button>
                          </>
                        )}
                        {popup.estado === 'aprobado' && user?.role === 'director_marketing' && (
                          <button type="button" onClick={() => publicarMutation.mutate(popup.id)} disabled={isPending} className="rounded-lg p-2 transition-colors hover:bg-[var(--admin-color-bg)] disabled:opacity-50" style={{ color: 'var(--admin-color-primary)' }} title="Publicar">
                            <FiPlay />
                          </button>
                        )}
                        {popup.estado === 'publicado' && user?.role === 'director_marketing' && (
                          <button type="button" onClick={() => finalizarMutation.mutate(popup.id)} disabled={isPending} className="rounded-lg p-2 transition-colors hover:bg-[var(--admin-color-bg)] disabled:opacity-50" style={{ color: 'var(--admin-color-text-secondary)' }} title="Finalizar">
                            <FiFlag />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
