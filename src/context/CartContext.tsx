import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { CartContext, type CartItem } from './CartContextType'
import type { Carrera } from '../types'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addItem = useCallback((product: Carrera, price: number, modality?: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.slug === product.slug)
      if (existing) {
        return prev.map(i =>
          i.product.slug === product.slug
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1, modality, price }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((slug: string) => {
    setItems(prev => prev.filter(i => i.product.slug !== slug))
  }, [])

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.slug !== slug))
      return
    }
    setItems(prev =>
      prev.map(i => (i.product.slug === slug ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
