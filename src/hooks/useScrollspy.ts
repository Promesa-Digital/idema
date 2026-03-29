import { useState, useEffect } from 'react'

export function useScrollspy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handler = () => {
      const scrollPos = window.scrollY + offset
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          const bottom = top + el.offsetHeight
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(id)
            return
          }
        }
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [sectionIds, offset])

  return activeSection
}
