import { useState, useCallback } from 'react'
import type { ToastMessage } from '../types'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string, duration = 5000) => {
    const id = String(++toastId)
    const toast: ToastMessage = { id, type, title, message, duration }
    setToasts(prev => [...prev, toast])
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
