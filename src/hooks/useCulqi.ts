import { useCallback, useEffect, useRef } from 'react'
import { useToast } from './useToast'

declare global {
  interface Window {
    Culqi: {
      publicKey: string
      settings: (config: Record<string, unknown>) => void
      options: (config: Record<string, unknown>) => void
      open: () => void
      close: () => void
      token: { id: string; email: string } | null
      order: Record<string, unknown> | null
      error: { merchant_message: string; user_message: string } | null
    }
    culqi: () => void
  }
}

interface CulqiPaymentConfig {
  title: string
  currency?: string
  amount: number // in cents (S/.150 = 15000)
  description?: string
  onSuccess?: (token: { id: string; email: string }) => void
  onError?: (error: string) => void
}

// Culqi public key - replace with production key for deploy
const CULQI_PUBLIC_KEY = 'pk_test_90667d0a57d45c48' // Test key - update for production

export function useCulqi() {
  const { addToast } = useToast()
  const callbackRef = useRef<CulqiPaymentConfig | null>(null)

  useEffect(() => {
    // Set up the global culqi callback
    window.culqi = () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token
        addToast('success', '¡Pago procesado!', `Tu pago ha sido registrado correctamente. Token: ${token.id.slice(0, 8)}...`)
        callbackRef.current?.onSuccess?.(token)
      } else if (window.Culqi.error) {
        const errorMsg = window.Culqi.error.user_message || 'Error al procesar el pago'
        addToast('error', 'Error en el pago', errorMsg)
        callbackRef.current?.onError?.(errorMsg)
      }
    }

    return () => {
      // Clean up
      window.culqi = () => {}
    }
  }, [addToast])

  const openCheckout = useCallback((config: CulqiPaymentConfig) => {
    if (!window.Culqi) {
      addToast('error', 'Error', 'El sistema de pagos no está disponible. Intenta recargar la página.')
      return
    }

    callbackRef.current = config

    window.Culqi.publicKey = CULQI_PUBLIC_KEY

    window.Culqi.settings({
      title: 'Instituto IDEMA',
      currency: config.currency || 'PEN',
      amount: config.amount,
      description: config.description || config.title,
    })

    window.Culqi.options({
      lang: 'es',
      style: {
        logo: 'https://idema.edu.pe/assets/img/idemaNEWLOGO2026.png',
        bannerColor: '#10323F',
        buttonBackground: '#00AFF0',
        menuColor: '#00AFF0',
        linksColor: '#00AFF0',
        buttonText: 'Pagar',
        buttonTextColor: '#ffffff',
        priceColor: '#00AFF0',
      },
    })

    window.Culqi.open()
  }, [addToast])

  return { openCheckout }
}
