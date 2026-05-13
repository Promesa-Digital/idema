import { createContext } from 'react'
import type { Carrera } from '../types'

export interface CartItem {
  product: Carrera
  quantity: number
  modality?: string
  price: number
}

export interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  totalItems: number
  totalPrice: number
  addItem: (product: Carrera, price: number, modality?: string) => void
  removeItem: (slug: string) => void
  updateQuantity: (slug: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  closeCart: () => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)
