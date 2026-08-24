import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiSend, FiCheck, FiX, FiPlay, FiFlag } from 'react-icons/fi'
import { fetchPopups, enviarAprobacionPopup, aprobarPopup, rechazarPopup, publicarPopup, finalizarPopup } from '../../api/adminPopupsApi'
import { POPUP_ESTADO_LABELS, type PopupEstado } from '../../types/admin'
import PopupEstadoBadge from '../../components/admin/PopupEstadoBadge'
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

  return (
    <>
      <Helmet>
        <title>Popups - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Popups</h1>
              <p className="text-white/60">Gestiona los anuncios full-screen y su flujo de aprobación.</p>
            </div>
            <Link
              to="/admin/popups/nuevo"
              className="inline-flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 whitespace-nowrap"
            >
              <FiPlus /> Nuevo popup
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as PopupEstado | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todos los estados</option>
              {(Object.keys(POPUP_ESTADO_LABELS) as PopupEstado[]).map((key) => (
                <option key={key} value={key}>{POPUP_ESTADO_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando popups...</p>}

            {isError && <p className="text-rose-300 text-center py-16">No se pudieron cargar los popups. Intenta de nuevo.</p>}

            {!isLoading && !isError && popups.length === 0 && (
              <p className="text-white/60 text-center py-16">No hay popups que coincidan con los filtros.</p>
            )}

            {!isLoading && !isError && popups.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Popup</th>
                      <th className="px-5 py-3 font-semibold">Vigencia</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popups.map((popup) => (
                      <tr key={popup.id} className="border-b border-white/5 last:border-0 text-white/90 align-top">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={popup.imagen_url}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-white/10 flex-shrink-0"
                            />
                            <span className="max-w-xs">{popup.texto}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-white/70 whitespace-nowrap">
                          {`${popup.fecha_inicio} → ${popup.fecha_fin}`}
                        </td>
                        <td className="px-5 py-4"><PopupEstadoBadge estado={popup.estado} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Link
                              to={`/admin/popups/${popup.id}/editar`}
                              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                              title="Editar"
                            >
                              <FiEdit2 />
                            </Link>

                            {(popup.estado === 'borrador' || popup.estado === 'rechazado') && (
                              <button
                                type="button"
                                onClick={() => enviarMutation.mutate(popup.id)}
                                disabled={isPending}
                                className="p-2 rounded-lg text-white/70 hover:text-primary hover:bg-white/10 transition disabled:opacity-50"
                                title="Enviar a aprobación"
                              >
                                <FiSend />
                              </button>
                            )}

                            {popup.estado === 'pendiente_aprobacion' && user?.role === 'director_marketing' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => aprobarMutation.mutate(popup.id)}
                                  disabled={isPending}
                                  className="p-2 rounded-lg text-white/70 hover:text-emerald-300 hover:bg-white/10 transition disabled:opacity-50"
                                  title="Aprobar"
                                >
                                  <FiCheck />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => rechazarMutation.mutate(popup.id)}
                                  disabled={isPending}
                                  className="p-2 rounded-lg text-white/70 hover:text-rose-300 hover:bg-white/10 transition disabled:opacity-50"
                                  title="Rechazar"
                                >
                                  <FiX />
                                </button>
                              </>
                            )}
                            {popup.estado === 'aprobado' && user?.role === 'director_marketing' && <button type="button" onClick={() => publicarMutation.mutate(popup.id)} disabled={isPending} className="p-2" title="Publicar"><FiPlay /></button>}
                            {popup.estado === 'publicado' && user?.role === 'director_marketing' && <button type="button" onClick={() => finalizarMutation.mutate(popup.id)} disabled={isPending} className="p-2" title="Finalizar"><FiFlag /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
