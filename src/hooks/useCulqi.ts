import { useCallback, useEffect, useRef } from 'react'
import { useToast } from './useToast'

interface CulqiTokenSuccess {
  object: 'token'
  id: string
  email: string
}

interface CulqiTokenError {
  object: 'error'
  type: string
  merchant_message: string
  user_message: string
}

type CulqiTokenResult = CulqiTokenSuccess | CulqiTokenError
type CulqiTokenizableData = CulqiCardData | { phone_number: string; otp: string }

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
      createToken: (data: CulqiTokenizableData, callback: (result: CulqiTokenResult) => void) => void
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

export interface CulqiCardData {
  card_number: string
  cvv: string
  expiration_month: string
  expiration_year: string
  email: string
}

const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY as string

export function useCulqi() {
  const { addToast } = useToast()
  const callbackRef = useRef<CulqiPaymentConfig | null>(null)

  useEffect(() => {
    // El script de index.html carga sin async/defer, así que window.Culqi ya
    // existe en el primer render — esto solo cubre el caso de que faltara.
    if (!document.getElementById('culqi-script')) {
      const script = document.createElement('script')
      script.id = 'culqi-script'
      script.src = 'https://checkout.culqi.com/js/v4'
      document.head.appendChild(script)
    }

    if (window.Culqi && CULQI_PUBLIC_KEY) {
      window.Culqi.publicKey = CULQI_PUBLIC_KEY
    }

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

  /** Tokeniza una tarjeta ingresada en un formulario propio (sin el popup de Checkout v4). */
  const createToken = useCallback((cardData: CulqiCardData): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.Culqi) {
        reject(new Error('El sistema de pagos no está disponible. Intenta recargar la página.'))
        return
      }
      window.Culqi.createToken(cardData, (result) => {
        if (result.object === 'error') reject(result)
        else resolve(result.id)
      })
    })
  }, [])

  /** Tokeniza un pago Yape a partir del celular + código OTP recibido en la app. */
  const createYapeToken = useCallback((phoneNumber: string, otp: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.Culqi) {
        reject(new Error('El sistema de pagos no está disponible. Intenta recargar la página.'))
        return
      }
      window.Culqi.createToken({ phone_number: phoneNumber, otp }, (result) => {
        if (result.object === 'error') reject(result)
        else resolve(result.id)
      })
    })
  }, [])

  return { openCheckout, createToken, createYapeToken }
}
