import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingCart, FaCreditCard } from 'react-icons/fa'
import { useCart } from '../../context/CartContext'
import { useCulqi } from '../../hooks/useCulqi'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart()
  const { openCheckout } = useCulqi()

  const handleCheckout = () => {
    if (totalPrice <= 0) return
    openCheckout({
      title: items.length === 1 ? items[0].product.title : `IDEMA - ${totalItems} productos`,
      amount: totalPrice * 100,
      description: items.map(i => i.product.title).join(', '),
      onSuccess: (token) => {
        console.log('Payment token received:', token.id)
        clearCart()
        closeCart()
      },
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-dark to-deep p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <FaShoppingCart className="text-xl" />
                <h2 className="text-lg font-bold">Carrito de Compras</h2>
                {totalItems > 0 && (
                  <span className="bg-white/20 text-sm px-2 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-deep/50">
                  <FaShoppingCart className="text-6xl mb-4 opacity-30" />
                  <p className="text-lg font-semibold">Tu carrito está vacío</p>
                  <p className="text-sm mt-1">Explora nuestros cursos y programas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <motion.div
                      key={item.product.slug}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="bg-surface rounded-xl p-4 border border-deep/10"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-deep text-sm leading-tight truncate">
                            {item.product.title}
                          </h3>
                          <p className="text-xs text-deep/70 mt-0.5">
                            {item.product.duration} • {item.modality || item.product.modality}
                          </p>
                          <p className="text-primary font-bold mt-1">
                            S/.{item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.product.slug)}
                          className="text-deep/50 hover:text-cta transition-colors p-1 self-start"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-deep/10">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.product.slug, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-surface hover:bg-surface flex items-center justify-center transition-colors"
                          >
                            <FaMinus className="text-[10px]" />
                          </button>
                          <span className="font-semibold text-deep w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.slug, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-primary/15 hover:bg-primary/25 text-dark flex items-center justify-center transition-colors"
                          >
                            <FaPlus className="text-[10px]" />
                          </button>
                        </div>
                        <span className="font-bold text-deep">
                          S/.{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-deep/10 p-5 space-y-4">
                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-deep/80 font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-deep">S/.{totalPrice.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-primary to-dark text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <FaCreditCard className="text-lg" />
                  Pagar con Culqi
                </motion.button>

                {/* Clear */}
                <button
                  onClick={clearCart}
                  className="w-full text-center text-sm text-deep/50 hover:text-cta transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
