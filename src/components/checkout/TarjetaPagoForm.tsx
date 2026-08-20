import { useState } from 'react'
import { FiCreditCard } from 'react-icons/fi'
import { useCulqi } from '../../hooks/useCulqi'
import { pagarConTarjeta } from '../../api/checkoutApi'
import type { ResumenPago } from '../../types/checkout'

interface TarjetaPagoFormProps {
  resumen: ResumenPago
  onSuccess: (mensaje: string) => void
  onError: (mensaje: string) => void
}

export default function TarjetaPagoForm({ resumen, onSuccess, onError }: TarjetaPagoFormProps) {
  const { openCheckout } = useCulqi()
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePagar = () => {
    openCheckout({
      title: resumen.concepto,
      amount: Math.round(resumen.monto * 100),
      description: resumen.concepto,
      onSuccess: async (token) => {
        setIsProcessing(true)
        try {
          const confirmacion = await pagarConTarjeta(resumen.ordenId, token.id)
          onSuccess(confirmacion.mensaje)
        } catch {
          onError('No se pudo confirmar el pago con tu banco. Intenta nuevamente.')
        } finally {
          setIsProcessing(false)
        }
      },
      onError: (mensaje) => onError(mensaje),
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-white/70 text-sm leading-relaxed">
        Pagarás <span className="text-white font-semibold">S/. {resumen.monto.toFixed(2)}</span> con tarjeta de
        crédito o débito a través de Culqi, de forma segura.
      </p>
      <button
        type="button"
        onClick={handlePagar}
        disabled={isProcessing}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        <FiCreditCard aria-hidden />
        {isProcessing ? 'Confirmando pago...' : `Pagar S/. ${resumen.monto.toFixed(2)}`}
      </button>
    </div>
  )
}
