import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FiFile, FiUpload } from 'react-icons/fi'
import { pagarConTransferencia } from '../../api/checkoutApi'
import { transferenciaSchema } from '../../schemas/checkout'
import type { ResumenPago } from '../../types/checkout'
import FieldError from '../ui/FieldError'

interface TransferenciaPagoFormProps {
  resumen: ResumenPago
  onSuccess: (mensaje: string) => void
  onError: (mensaje: string) => void
}

const CUENTAS_BANCARIAS = [
  { banco: 'BCP', lineas: ['Recaudación: 20430', 'Cuenta: 25105155619028', 'CCI: 00225110515561902870'] },
  { banco: 'BBVA', lineas: ['Cuenta: 001107630200236164'] },
  { banco: 'Interbank', lineas: ['Cuenta: 5503004249241', 'CCI: 003550003004249241'] },
]

export default function TransferenciaPagoForm({ resumen, onSuccess, onError }: TransferenciaPagoFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [voucher, setVoucher] = useState<File | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: (file: File) => pagarConTransferencia(resumen.ordenId, file),
    onSuccess: (confirmacion) => onSuccess(confirmacion.mensaje),
    onError: () => onError('No se pudo subir tu comprobante. Intenta nuevamente.'),
  })

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVoucher(e.target.files?.[0] ?? null)
    setFieldError(undefined)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = transferenciaSchema.safeParse({ voucher })
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message)
      return
    }
    setFieldError(undefined)
    mutation.mutate(result.data.voucher)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <p className="text-white/70 text-sm leading-relaxed mb-3">
          Transfiere <span className="text-white font-semibold">S/. {resumen.monto.toFixed(2)}</span> a alguna de
          nuestras cuentas y sube tu comprobante para validar el pago.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CUENTAS_BANCARIAS.map((c) => (
            <div key={c.banco} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <p className="text-xs font-bold text-primary mb-1">{c.banco}</p>
              {c.lineas.map((l) => (
                <p key={l} className="text-[11px] text-white/60 leading-snug">
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="checkout-transferencia-voucher" className="block text-white text-sm font-semibold mb-2">
          Comprobante de transferencia
        </label>
        <input
          ref={inputRef}
          id="checkout-transferencia-voucher"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          disabled={mutation.isPending}
          className="sr-only"
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'checkout-transferencia-err' : undefined}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={mutation.isPending}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-dashed transition disabled:opacity-60 ${
            fieldError ? 'border-rose-400' : 'border-white/20 hover:border-primary'
          }`}
        >
          {voucher ? (
            <FiFile className="text-primary flex-shrink-0" aria-hidden />
          ) : (
            <FiUpload className="text-white/50 flex-shrink-0" aria-hidden />
          )}
          <span className="text-sm text-white/80 truncate">
            {voucher ? voucher.name : 'Seleccionar imagen o PDF (máx. 5 MB)'}
          </span>
        </button>
        <FieldError id="checkout-transferencia-err" message={fieldError} />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {mutation.isPending && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        <FiUpload aria-hidden />
        {mutation.isPending ? 'Subiendo comprobante...' : 'Enviar comprobante'}
      </button>
    </form>
  )
}
