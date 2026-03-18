import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import { footerLinks } from '../../data/navigation'

const socialIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
}

export default function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <footer className="gradient-footer text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12"
        >
          {/* Logo and Description */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <img src="/assets/img/idema-white.png" alt="IDEMA" className="h-12 w-auto mb-4" />
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Instituto IDEMA: Formando profesionales de excelencia en educación técnica y superior.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {footerLinks.social.map(social => {
                const Icon = socialIconMap[social.icon] as React.ComponentType<{ className?: string }>
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-bold mb-6">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map(link => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-white/80 hover:text-primary transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Careers */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-bold mb-6">Carreras</h3>
            <ul className="space-y-3">
              {footerLinks.careers.map(career => (
                <li key={career.href}>
                  <Link
                    to={career.href}
                    className="text-white/80 hover:text-primary transition-colors text-sm"
                  >
                    {career.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* News & Resources */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-bold mb-6">Recursos</h3>
            <ul className="space-y-3">
              {footerLinks.news.map(item => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-primary transition-colors text-sm"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-white/80 hover:text-primary transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="border-t border-white/20 pt-8 mb-8"
        >
          <h3 className="text-lg font-bold mb-6">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {footerLinks.contact.addresses.map((addr, idx) => (
              <div key={idx} className="flex gap-3">
                <FaMapMarkerAlt className="w-5 h-5 text-surface flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-surface">{addr.label}</p>
                  <p className="text-white/80 text-sm">{addr.value}</p>
                  {addr.phone && (
                    <p className="text-white/80 text-sm flex items-center gap-1.5 mt-1">
                      <FaPhone className="w-3 h-3 text-[#0dcaf0]" />
                      {addr.phone}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-6">
            <div className="flex gap-3">
<<<<<<< HEAD
              <FaPhone className="w-5 h-5 text-surface flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-surface">Teléfono</p>
                <p className="text-white/80 text-sm">{footerLinks.contact.phone}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <FaEnvelope className="w-5 h-5 text-surface flex-shrink-0 mt-0.5" />
=======
              <FaEnvelope className="w-5 h-5 text-[#0dcaf0] flex-shrink-0 mt-0.5" />
>>>>>>> 94ff1ec (fix: update footer contact - phone per location)
              <div>
                <p className="text-sm font-semibold text-surface">Email</p>
                <a href={`mailto:${footerLinks.contact.email}`} className="text-white/80 hover:text-primary text-sm transition-colors">
                  {footerLinks.contact.email}
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-white/70 text-sm">
            &copy; {new Date().getFullYear()} Instituto IDEMA. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap gap-4 md:gap-6 text-white/70 text-sm">
            <Link to="/politica-privacidad" className="hover:text-primary transition-colors">
              Políticas de Privacidad
            </Link>
            <Link to="/terminos-y-condiciones" className="hover:text-primary transition-colors">
              Términos y Condiciones
            </Link>
            <Link to="/libro-reclamaciones" className="hover:text-primary transition-colors">
              Libro de Reclamaciones
            </Link>
            <Link to="/eliminar-cuenta" className="hover:text-primary transition-colors">
              Eliminar Cuenta
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
