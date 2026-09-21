import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Navbar from './layout/Navbar'
import Footer from './layout/Footer'
import ToastContainer from './ui/ToastContainer'
import WhatsAppButton from './ui/WhatsAppButton'
import ScrollToTop from './ui/ScrollToTop'
import CartDrawer from './cart/CartDrawer'
import AnnouncementModal from './ui/AnnouncementModal'
import { usePageTracking } from '../hooks/useAnalytics'
import { flushRetryQueue } from '../utils/leadIntake'

export default function Layout() {
  const { pathname } = useLocation()
  usePageTracking()

  useEffect(() => {
    void flushRetryQueue()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <link rel="canonical" href={`https://idema.edu.pe${pathname}`} />
        <meta property="og:site_name" content="Instituto IDEMA" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://idema.edu.pe${pathname}`} />
        <meta property="og:image" content="https://idema.edu.pe/assets/img/principal.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://idema.edu.pe/assets/img/principal.webp" />
      </Helmet>
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <CartDrawer />
      <AnnouncementModal />
      <ToastContainer />
    </div>
  )
}
