import { useCallback } from 'react'
import { useToastContext } from '../context/ToastContext'
import type { Toast } from '../context/ToastContext'

export function useToast() {
  const { addToast: addToastContext } = useToastContext()

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    addToastContext(type, title, message)
  }, [addToastContext])

  return { addToast }
}
