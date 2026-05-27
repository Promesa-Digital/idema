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
      try { history.replaceState(null, '', '/#contacto') } catch {}
      return
    }
    window.location.href = `mailto:info@idema.edu.pe?subject=${encodeURIComponent(subject)}`
  }

  return (
    // keep href for accessibility
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a href="/#contacto" onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
