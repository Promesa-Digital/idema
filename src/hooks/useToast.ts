import { useCallback, useContext } from 'react'
import { ToastContext } from '../context/ToastContextType'
import type { Toast } from '../context/ToastContextType'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    context.addToast(type, title, message)
  }, [context])

  return { addToast }
}
