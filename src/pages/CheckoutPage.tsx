import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchResumenPago } from '../api/checkoutApi'
import type { MetodoPago } from '../types/checkout'
import MetodoPagoTabs from '../components/checkout/MetodoPagoTabs'
import TarjetaPagoForm from '../components/checkout/TarjetaPagoForm'
import YapePagoForm from '../components/checkout/YapePagoForm'
import TransferenciaPagoForm from '../components/checkout/TransferenciaPagoForm'
import SuccessCheck from '../components/ui/SuccessCheck'
import { useToast } from '../hooks/useToast'

const RESUMEN_QUERY_KEY = ['portal', 'pagos', 'pendiente'] as const

export default function CheckoutPage() {
  const { addToast } = useToast()
  const [metodo, setMetodo] = useState<MetodoPago>('tarjeta')
  const [confirmacion, setConfirmacion] = useState<string | null>(null)

  const { data: resumen, isLoading, isError } = useQuery({
    queryKey: RESUMEN_QUERY_KEY,
    queryFn: fetchResumenPago,
  })

  const handleSuccess = (mensaje: string) => {
    setConfirmacion(mensaje)
    addToast('success', 'Pago registrado', mensaje)
  }

  const handleError = (mensaje: string) => {
    addToast('error', 'No se pudo procesar el pago', mensaje)
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Portal - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Realizar pago</h1>
          <p className="text-white/80 mb-8">Elige tu medio de pago preferido para completar tu pago pendiente.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando tu pago pendiente...</p>}

            {isError && (
              <p className="text-rose-300 text-center py-16">
                No se pudo cargar la información de tu pago. Intenta nuevamente.
              </p>
            )}

            {!isLoading && !isError && !resumen && !confirmacion && (
              <p className="text-white/60 text-center py-16">No tienes pagos pendientes por el momento.</p>
            )}

            {!isLoading && !isError && resumen && !confirmacion && (
              <>
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                  <div>
                    <p className="text-white/60 text-sm">{resumen.concepto}</p>
                    <p className="text-white text-2xl font-bold">S/. {resumen.monto.toFixed(2)}</p>
                  </div>
                </div>

                <MetodoPagoTabs value={metodo} onChange={setMetodo} />

                {metodo === 'tarjeta' && (
                  <TarjetaPagoForm resumen={resumen} onSuccess={handleSuccess} onError={handleError} />
                )}
                {metodo === 'yape' && (
                  <YapePagoForm resumen={resumen} onSuccess={handleSuccess} onError={handleError} />
                )}
                {metodo === 'transferencia' && (
                  <TransferenciaPagoForm resumen={resumen} onSuccess={handleSuccess} onError={handleError} />
                )}
              </>
            )}

            {confirmacion && (
              <div className="flex flex-col items-center text-center py-10 gap-4">
                <SuccessCheck />
                <h2 className="text-xl font-bold text-white">¡Listo!</h2>
                <p className="text-white/70 leading-relaxed">{confirmacion}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
