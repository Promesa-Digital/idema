import { useCallback, useContext } from 'react'
import { ToastContext } from '../context/ToastContextType'
import type { Toast } from '../context/ToastContextType'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  const { addToast: addToastContext } = context

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    addToastContext(type, title, message)
  }, [addToastContext])

  return { addToast }
}
