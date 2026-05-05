import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './layout/Navbar'
import Footer from './layout/Footer'
import ToastContainer from './ui/ToastContainer'
import WhatsAppButton from './ui/WhatsAppButton'
import ScrollToTop from './ui/ScrollToTop'
import CartDrawer from './cart/CartDrawer'
import { usePageTracking } from '../hooks/useAnalytics'
import { flushRetryQueue } from '../utils/leadIntake'

export default function Layout() {
  usePageTracking()

  useEffect(() => {
    void flushRetryQueue()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
      <ToastContainer />
    </div>
  )
}
