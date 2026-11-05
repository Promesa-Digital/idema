import React from 'react'

type Props = {
  children: React.ReactNode
  subject?: string
  className?: string
}

export default function ContactLink({ children, subject = 'Consulta', className }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window === 'undefined') return
    const el = document.getElementById('contacto')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      try {
        window.history.replaceState(null, '', '/#contacto')
      } catch {
        window.location.hash = 'contacto'
      }
      return
    }
    window.location.href = `mailto:info@idema.edu.pe?subject=${encodeURIComponent(subject)}`
  }

  return (
    <a href="/#contacto" onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
