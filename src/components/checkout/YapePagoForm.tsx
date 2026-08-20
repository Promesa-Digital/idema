import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FiSmartphone } from 'react-icons/fi'
import { pagarConYape } from '../../api/checkoutApi'
import { yapeSchema } from '../../schemas/checkout'
import type { ResumenPago } from '../../types/checkout'
import FieldError from '../ui/FieldError'

interface YapePagoFormProps {
  resumen: ResumenPago
  onSuccess: (mensaje: string) => void
  onError: (mensaje: string) => void
}

export default function YapePagoForm({ resumen, onSuccess, onError }: YapePagoFormProps) {
  const [celular, setCelular] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: (valorCelular: string) => pagarConYape(resumen.ordenId, valorCelular),
    onSuccess: (confirmacion) => onSuccess(confirmacion.mensaje),
    onError: () => onError('No se pudo enviar la solicitud de cobro a Yape. Intenta nuevamente.'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = yapeSchema.safeParse({ celular })
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)
    mutation.mutate(result.data.celular)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <p className="text-white/70 text-sm leading-relaxed">
        Te enviaremos una solicitud de cobro por{' '}
        <span className="text-white font-semibold">S/. {resumen.monto.toFixed(2)}</span> a tu Yape. Ingresa el
        número asociado a tu cuenta para continuar.
      </p>

      <div>
        <label htmlFor="checkout-yape-celular" className="block text-white text-sm font-semibold mb-2">
          Número de celular (Yape)
        </label>
        <input
          id="checkout-yape-celular"
          type="tel"
          inputMode="numeric"
          placeholder="987654321"
          value={celular}
          onChange={(e) => {
            setCelular(e.target.value)
            setFieldError(undefined)
          }}
          disabled={mutation.isPending}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'checkout-yape-err' : undefined}
          className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${
            fieldError ? 'ring-2 ring-rose-400' : ''
          }`}
        />
        <FieldError id="checkout-yape-err" message={fieldError} />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {mutation.isPending && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        <FiSmartphone aria-hidden />
        {mutation.isPending ? 'Enviando solicitud...' : 'Enviar solicitud a Yape'}
      </button>
    </form>
  )
}
