import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiClock, FiCreditCard } from 'react-icons/fi'
import { getOrden, createOrden } from '../../api/ordenes'
import { fetchMiPerfil } from '../../api/alumnoApi'
import { useCulqi } from '../../hooks/useCulqi'
import { tarjetaSchema, yapeSchema, YAPE_LIMITE_SOLES } from '../../schemas/checkout'
import type { OrdenPagoMedioPago } from '../../types'
import PageHeader from '../../components/ui/PageHeader'
import FormInput from '../../components/ui/FormInput'
import Button from '../../components/ui/Button'
import { formatMonto } from '../../utils/format'

const CUENTAS_BANCARIAS = [
  { banco: 'BCP', numero: '25105155619028', cci: '00225110515561902870' },
  { banco: 'Interbank', numero: '5503004249241', cci: '003550003004249241' },
]

const cardClass = 'rounded-[var(--radius-md)] bg-[var(--color-bg-card)] p-6'

function soloDigitos(value: string): string {
  return value.replace(/\D/g, '')
}

function formatearNumeroTarjeta(value: string): string {
  return soloDigitos(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatearExpiracion(value: string): string {
  const digitos = soloDigitos(value).slice(0, 4)
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { createToken, createYapeToken } = useCulqi()
  const ordenId = searchParams.get('orden_id')
  const programaNombre = (location.state as { programaNombre?: string } | null)?.programaNombre

  const [tab, setTab] = useState<OrdenPagoMedioPago>('transferencia')
  const [cardNumber, setCardNumber] = useState('')
  const [expiracion, setExpiracion] = useState('')
  const [cvv, setCvv] = useState('')
  const [titular, setTitular] = useState('')
  const [celularYape, setCelularYape] = useState('')
  const [otpYape, setOtpYape] = useState('')
  const [voucherUrl, setVoucherUrl] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [tokenizando, setTokenizando] = useState(false)

  const { data: orden, isLoading } = useQuery({
    queryKey: ['portal', 'orden', ordenId],
    queryFn: () => getOrden(ordenId!),
    enabled: !!ordenId,
  })
  const { data: perfil } = useQuery({ queryKey: ['alumno', 'perfil'], queryFn: fetchMiPerfil })

  const mutation = useMutation({
    mutationFn: createOrden,
    onSuccess: (nuevaOrden) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'ordenes'] })
      navigate(`/portal/checkout?orden_id=${nuevaOrden.id}`, { replace: true, state: { programaNombre } })
    },
    onError: () => setError('No se pudo registrar el pago. Intenta nuevamente.'),
  })

  if (!ordenId) {
    return (
      <div className={cardClass}>
        <p className="text-[var(--color-text-main)]">Falta indicar la orden a pagar.</p>
        <Link to="/portal/matriculas" className="mt-3 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline">
          Volver a Mis Matrículas
        </Link>
      </div>
    )
  }

  const change = (setter: (v: string) => void, field: string) => (v: string) => {
    setter(v)
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    setError(null)
  }

  const handleConfirmarTarjeta = async () => {
    const result = tarjetaSchema.safeParse({ cardNumber, expiracion, cvv, titular })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    if (!perfil?.email) {
      setError('No pudimos obtener tu correo de contacto. Actualízalo en Mi Cuenta e inténtalo de nuevo.')
      return
    }
    setError(null)
    setTokenizando(true)
    try {
      const [mes, anio] = result.data.expiracion.split('/')
      const token = await createToken({
        card_number: result.data.cardNumber,
        cvv: result.data.cvv,
        expiration_month: mes,
        expiration_year: `20${anio}`,
        email: perfil.email,
      })
      mutation.mutate({ concepto_id: orden!.concepto_id, medio_pago: 'tarjeta', token_culqi: token })
    } catch (culqiError) {
      const mensaje = (culqiError as { user_message?: string })?.user_message ?? 'No se pudo validar la tarjeta. Revisa los datos e inténtalo nuevamente.'
      setError(mensaje)
    } finally {
      setTokenizando(false)
    }
  }

  const handleConfirmarYape = async () => {
    const result = yapeSchema.safeParse({ celular: celularYape, otp: otpYape })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    if (orden && Number(orden.monto) > YAPE_LIMITE_SOLES) {
      setError(`Yape solo admite pagos de hasta S/ ${YAPE_LIMITE_SOLES.toLocaleString('es-PE')} por transacción. Elige otro medio de pago para este monto.`)
      return
    }
    setError(null)
    setTokenizando(true)
    try {
      const token = await createYapeToken(result.data.celular, result.data.otp)
      mutation.mutate({ concepto_id: orden!.concepto_id, medio_pago: 'yape', token_culqi: token })
    } catch (culqiError) {
      const mensaje = (culqiError as { user_message?: string })?.user_message ?? 'No se pudo validar el código OTP. Verifícalo e inténtalo nuevamente.'
      setError(mensaje)
    } finally {
      setTokenizando(false)
    }
  }

  const handleConfirmarTransferencia = () => {
    if (!voucherUrl.trim()) {
      setError('Ingresa la URL del voucher de transferencia.')
      return
    }
    setError(null)
    mutation.mutate({ concepto_id: orden!.concepto_id, medio_pago: 'transferencia', voucher_url: voucherUrl.trim() })
  }

  const handleConfirmar = () => {
    if (!orden) return
    if (tab === 'tarjeta') void handleConfirmarTarjeta()
    else if (tab === 'yape') void handleConfirmarYape()
    else handleConfirmarTransferencia()
  }

  const procesando = mutation.isPending || tokenizando
  const esExitoso = orden && (orden.estado === 'pagada' || orden.estado === 'pendiente_confirmacion')
  const esFallida = orden && orden.estado === 'fallida'
  const puedeReintentar = orden && (orden.estado === 'pendiente' || orden.estado === 'fallida')

  return (
    <>
      <Helmet>
        <title>Procesar pago - Portal - IDEMA</title>
      </Helmet>

      <PageHeader title="Procesar pago" subtitle={programaNombre ? `Matrícula: ${programaNombre}` : undefined} />

      {isLoading && <p className="text-[var(--color-text-secondary)]">Cargando orden...</p>}

      {orden && (
        <div className="max-w-lg space-y-6">
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-secondary)]">Monto a pagar</p>
              <p className="text-2xl font-bold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>{formatMonto(orden.monto)}</p>
            </div>
          </div>

          {esExitoso && (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[#DCFCE7] p-5 text-[#16A34A]">
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
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[#FEE2E2] p-5 text-[var(--color-error)]">
              <FiXCircle className="mt-0.5 h-6 w-6 shrink-0" />
              <p className="text-sm font-semibold">El pago no pudo procesarse.</p>
            </div>
          )}

          {puedeReintentar && (
            <div className={cardClass}>
              {orden.estado === 'fallida' && (
                <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[#FEE2E2] px-3 py-2 text-sm text-[var(--color-error)]">
                  <FiXCircle /> El intento anterior falló. Puedes reintentar con otro medio de pago.
                </div>
              )}
              {orden.estado === 'pendiente' && (
                <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[#FEF9C3] px-3 py-2 text-sm text-[#CA8A04]">
                  <FiClock /> Pago pendiente de confirmación.
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-[var(--radius-sm)] bg-[#FEE2E2] px-3 py-2 text-sm text-[var(--color-error)]" role="alert">{error}</div>
              )}

              <div className="mb-5 flex gap-2">
                {(['tarjeta', 'yape', 'transferencia'] as OrdenPagoMedioPago[]).map((medio) => (
                  <button
                    key={medio}
                    type="button"
                    onClick={() => { setTab(medio); setFieldErrors({}); setError(null) }}
                    className={`flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      tab === medio
                        ? 'border-[var(--color-primary)] bg-[var(--color-highlight)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {medio}
                  </button>
                ))}
              </div>

              {tab === 'tarjeta' && (
                <div className="space-y-4">
                  <FormInput
                    label="Número de tarjeta"
                    value={cardNumber}
                    onChange={(v) => change(setCardNumber, 'cardNumber')(formatearNumeroTarjeta(v))}
                    error={fieldErrors.cardNumber}
                    placeholder="0000 0000 0000 0000"
                    inputMode="numeric"
                    disabled={procesando}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Fecha expiración"
                      value={expiracion}
                      onChange={(v) => change(setExpiracion, 'expiracion')(formatearExpiracion(v))}
                      error={fieldErrors.expiracion}
                      placeholder="MM/AA"
                      inputMode="numeric"
                      disabled={procesando}
                    />
                    <FormInput
                      label="CVV"
                      value={cvv}
                      onChange={(v) => change(setCvv, 'cvv')(soloDigitos(v).slice(0, 3))}
                      error={fieldErrors.cvv}
                      placeholder="123"
                      inputMode="numeric"
                      type="password"
                      disabled={procesando}
                    />
                  </div>
                  <FormInput
                    label="Nombre del titular"
                    value={titular}
                    onChange={change(setTitular, 'titular')}
                    error={fieldErrors.titular}
                    placeholder="Como figura en la tarjeta"
                    disabled={procesando}
                  />
                </div>
              )}

              {tab === 'yape' && (
                <div className="space-y-4">
                  <FormInput
                    label="Número de celular"
                    value={celularYape}
                    onChange={(v) => change(setCelularYape, 'celular')(soloDigitos(v).slice(0, 9))}
                    error={fieldErrors.celular}
                    placeholder="987654321"
                    inputMode="numeric"
                    disabled={procesando}
                  />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Ingresa el código OTP que recibirás en tu app Yape.
                  </p>
                  <FormInput
                    label="Código OTP"
                    value={otpYape}
                    onChange={(v) => change(setOtpYape, 'otp')(soloDigitos(v).slice(0, 6))}
                    error={fieldErrors.otp}
                    placeholder="123456"
                    inputMode="numeric"
                    disabled={procesando}
                  />
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Límite máximo S/ {YAPE_LIMITE_SOLES.toLocaleString('es-PE')} por transacción.
                  </p>
                </div>
              )}

              {tab === 'transferencia' && (
                <div className="space-y-4">
                  <div className="space-y-3 rounded-[var(--radius-sm)] bg-[var(--color-bg-page)] p-4 text-sm">
                    {CUENTAS_BANCARIAS.map((c) => (
                      <div key={c.banco}>
                        <p className="font-semibold text-[var(--color-text-main)]">{c.banco}</p>
                        <p className="text-[var(--color-text-secondary)]">Cuenta: {c.numero}</p>
                        <p className="text-[var(--color-text-secondary)]">CCI: {c.cci}</p>
                      </div>
                    ))}
                  </div>
                  <FormInput
                    label="URL del voucher"
                    value={voucherUrl}
                    onChange={(v) => { setVoucherUrl(v); setError(null) }}
                    placeholder="https://..."
                    disabled={procesando}
                  />
                </div>
              )}

              <Button variant="primary" onClick={handleConfirmar} disabled={procesando} className="mt-5 w-full">
                <FiCreditCard /> {procesando ? 'Procesando...' : 'Confirmar pago'}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
