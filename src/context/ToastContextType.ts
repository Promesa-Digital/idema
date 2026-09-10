import { createContext } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

export interface ToastContextType {
  toasts: Toast[]
  addToast: (type: Toast['type'], title: string, message: string) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)
