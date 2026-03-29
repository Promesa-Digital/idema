import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-0Y93Y3V0JR', {
        page_path: location.pathname + location.search,
      })
    }
  }, [location])
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}
