import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiClock, FiCreditCard } from 'react-icons/fi'
import { getOrden, createOrden } from '../../api/ordenes'
import type { OrdenPagoMedioPago } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import { formatMonto } from '../../utils/format'

const CUENTAS_BANCARIAS = [
  { banco: 'BCP', numero: '25105155619028', cci: '00225110515561902870' },
  { banco: 'Interbank', numero: '5503004249241', cci: '003550003004249241' },
]

const inputClass =
  'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)]'
const cardClass =
  'rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)]'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const ordenId = searchParams.get('orden_id')
  const programaNombre = (location.state as { programaNombre?: string } | null)?.programaNombre

  const [tab, setTab] = useState<OrdenPagoMedioPago>('transferencia')
  const [tokenCulqi, setTokenCulqi] = useState('')
  const [celularYape, setCelularYape] = useState('')
  const [voucherUrl, setVoucherUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: orden, isLoading } = useQuery({
    queryKey: ['portal', 'orden', ordenId],
    queryFn: () => getOrden(ordenId!),
    enabled: !!ordenId,
  })

  const mutation = useMutation({
    mutationFn: createOrden,
    onSuccess: (nuevaOrden) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'ordenes'] })
      navigate(`/portal/checkout?orden_id=${nuevaOrden.id}`, { replace: true, state: { programaNombre } })
    },
    onError: () => setError('No se pudo procesar el pago. Intenta nuevamente.'),
  })

  if (!ordenId) {
    return (
      <div className={cardClass} style={{ borderColor: 'var(--admin-color-border)' }}>
        <p style={{ color: 'var(--admin-color-text-primary)' }}>Falta indicar la orden a pagar.</p>
        <Link to="/portal/matriculas" className="mt-3 inline-block text-sm font-semibold" style={{ color: 'var(--admin-color-primary)' }}>
          Volver a Mis Matrículas
        </Link>
      </div>
    )
  }

  const handleConfirmar = () => {
    if (!orden) return
    setError(null)
    if (tab === 'transferencia' && !voucherUrl.trim()) {
      setError('Ingresa la URL del voucher de transferencia.')
      return
    }
    if (tab === 'tarjeta' && !tokenCulqi.trim()) {
      setError('Ingresa el token de pago.')
      return
    }
    if (tab === 'yape' && !celularYape.trim()) {
      setError('Ingresa tu número de celular Yape.')
      return
    }
    mutation.mutate({
      concepto_id: orden.concepto_id,
      medio_pago: tab,
      // Yape usa el número como referencia de cobro (Culqi.js real llega después);
      // hasta entonces, ambos casos viajan en el mismo campo `token_culqi`.
      token_culqi: tab === 'tarjeta' ? tokenCulqi.trim() : tab === 'yape' ? celularYape.trim() : undefined,
      voucher_url: tab === 'transferencia' ? voucherUrl.trim() : undefined,
    })
  }

  const esExitoso = orden && (orden.estado === 'pagada' || orden.estado === 'pendiente_confirmacion')
  const esFallida = orden && orden.estado === 'fallida'
  const puedeReintentar = orden && (orden.estado === 'pendiente' || orden.estado === 'fallida')

  return (
    <>
      <Helmet>
        <title>Procesar pago - Portal - IDEMA</title>
      </Helmet>

      <PageHeader title="Procesar pago" subtitle={programaNombre ? `Matrícula: ${programaNombre}` : undefined} />

      {isLoading && <p style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando orden...</p>}

      {orden && (
        <div className="max-w-lg space-y-6">
          <div className={cardClass} style={{ borderColor: 'var(--admin-color-border)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Monto a pagar</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>{formatMonto(orden.monto)}</p>
            </div>
          </div>

          {esExitoso && (
            <div className="flex items-start gap-3 rounded-[var(--admin-radius-md)] bg-emerald-50 p-5 text-emerald-800">
              <FiCheckCircle className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold">
                  {orden.estado === 'pagada' ? 'Pago confirmado' : 'Transferencia recibida'}
                </p>
                <p className="mt-1 text-sm">
                  {orden.estado === 'pagada'
                    ? 'Tu pago se registró correctamente.'
                    : 'Estamos verificando tu voucher. Te confirmaremos cuando quede validado.'}
                </p>
              </div>
            </div>
          )}

          {esFallida && !puedeReintentar && (
            <div className="flex items-start gap-3 rounded-[var(--admin-radius-md)] bg-red-50 p-5 text-red-800">
              <FiXCircle className="mt-0.5 h-6 w-6 shrink-0" />
              <p className="text-sm font-semibold">El pago no pudo procesarse.</p>
            </div>
          )}

          {puedeReintentar && (
            <div className={cardClass} style={{ borderColor: 'var(--admin-color-border)' }}>
              {orden.estado === 'fallida' && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <FiXCircle /> El intento anterior falló. Puedes reintentar con otro medio de pago.
                </div>
              )}
              {orden.estado === 'pendiente' && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <FiClock /> Pago pendiente de confirmación.
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>
              )}

              <div className="mb-4 flex gap-2">
                {(['tarjeta', 'yape', 'transferencia'] as OrdenPagoMedioPago[]).map((medio) => (
                  <button
                    key={medio}
                    type="button"
                    onClick={() => setTab(medio)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors"
                    style={
                      tab === medio
                        ? { borderColor: 'var(--admin-color-primary)', backgroundColor: 'var(--admin-color-highlight)', color: 'var(--admin-color-primary)' }
                        : { borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }
                    }
                  >
                    {medio}
                  </button>
                ))}
              </div>

              {tab === 'tarjeta' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
                    Token de tarjeta (Culqi)
                  </label>
                  <input
                    type="text" value={tokenCulqi} onChange={(e) => setTokenCulqi(e.target.value)}
                    placeholder="tok_..." className={inputClass}
                    style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
                  />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>
                    Placeholder de texto — Culqi.js se integra con las credenciales reales más adelante.
                  </p>
                </div>
              )}

              {tab === 'yape' && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
                    Número de celular Yape
                  </label>
                  <input
                    type="tel" value={celularYape} onChange={(e) => setCelularYape(e.target.value)}
                    placeholder="987654321" className={inputClass}
                    style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
                  />
                </div>
              )}

              {tab === 'transferencia' && (
                <div className="space-y-4">
                  <div className="space-y-2 rounded-lg bg-[var(--admin-color-bg)] p-4 text-sm">
                    {CUENTAS_BANCARIAS.map((c) => (
                      <div key={c.banco}>
                        <p className="font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>{c.banco}</p>
                        <p style={{ color: 'var(--admin-color-text-secondary)' }}>Cuenta: {c.numero}</p>
                        <p style={{ color: 'var(--admin-color-text-secondary)' }}>CCI: {c.cci}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
                      URL del voucher
                    </label>
                    <input
                      type="text" value={voucherUrl} onChange={(e) => setVoucherUrl(e.target.value)}
                      placeholder="https://..." className={inputClass}
                      style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmar}
                disabled={mutation.isPending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] disabled:opacity-60"
              >
                <FiCreditCard /> {mutation.isPending ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
