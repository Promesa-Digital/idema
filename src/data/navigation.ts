export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export interface DropdownItem extends NavLink {
  icon: string
}

export const mainNavLinks: NavLink[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Programas', href: '/programas' },
  { label: 'Sobre Nosotros', href: '/nosotros' },
]

export const accederDropdown: DropdownItem[] = [
  { label: 'Árbol de Habilidades', href: '/idema-educa', icon: 'FaSitemap' },
  { label: 'Noticias IDEMA', href: 'https://website.instituto-idema.org/', icon: 'FaNewspaper', external: true },
  { label: 'Campus Virtual', href: 'https://aprende.instituto-idema.org/', icon: 'FaGraduationCap', external: true },
  { label: 'Biblioteca Virtual', href: 'https://books.instituto-idema.org/', icon: 'FaBook', external: true },
  { label: 'Bolsa de Trabajo', href: 'https://jobs.instituto-idema.org/', icon: 'FaBriefcase', external: true },
  { label: 'Intranet', href: 'https://apps.instituto-idema.org/', icon: 'FaUsers', external: true },
  { label: 'Idema Bot', href: 'https://bot.instituto-idema.org/', icon: 'FaRobot', external: true },
  { label: 'Inscríbete', href: 'https://www.aprende.instituto-idema.org/main/auth/inscription.php', icon: 'FaUserPlus', external: true },
]

export const countryCodes = [
  { code: '51', flag: '🇵🇪', label: 'PE' },
  { code: '54', flag: '🇦🇷', label: 'AR' },
  { code: '55', flag: '🇧🇷', label: 'BR' },
  { code: '56', flag: '🇨🇱', label: 'CL' },
  { code: '57', flag: '🇨🇴', label: 'CO' },
  { code: '52', flag: '🇲🇽', label: 'MX' },
  { code: '593', flag: '🇪🇨', label: 'EC' },
  { code: '591', flag: '🇧🇴', label: 'BO' },
  { code: '34', flag: '🇪🇸', label: 'ES' },
  { code: '1', flag: '🇺🇸', label: 'US' },
]

export const footerLinks = {
  quickLinks: [
    { label: 'Inicio', href: '/' },
    { label: 'Oferta Educativa', href: '/programas' },
    { label: 'Campus Virtual', href: 'https://aprende.instituto-idema.org', external: true },
    { label: 'Sobre Nosotros', href: '/nosotros' },
    { label: 'Contacto', href: '/#contacto' },
  ],
  careers: [
    { label: 'Técnico en Enfermería', href: '/carreras/enfermeria' },
    { label: 'Técnico en Contabilidad', href: '/carreras/contabilidad' },
    { label: 'Técnico en Agropecuaria', href: '/carreras/agropecuaria' },
    { label: 'Técnico en Admin. Bancaria', href: '/carreras/administracion-bancaria' },
    { label: 'Técnico en Admin. Empresas', href: '/carreras/administracion' },
  ],
  news: [
    { label: 'Orientación Vocacional', href: '/orientacion-vocacional' },
    { label: 'Biblioteca Virtual', href: 'https://books.instituto-idema.org', external: true },
    { label: 'Bolsa de Trabajo', href: 'https://jobs.instituto-idema.org', external: true },
    { label: 'Medios de Pago', href: '/servicios/medios-pago' },
    { label: 'Preguntas Frecuentes', href: '/faq' },
    { label: 'Noticias y Eventos', href: 'https://website.instituto-idema.org/', external: true },
  ],
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/IdemaInstituto', icon: 'FaFacebookF' },
    { label: 'Instagram', href: 'https://www.instagram.com/idemaperu/', icon: 'FaInstagram' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/instituto-idema/', icon: 'FaLinkedinIn' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@idemaperu', icon: 'FaTiktok' },
  ],
  contact: {
    addresses: [
      { label: 'INSTITUTO', value: 'Urb. Las Malvinas U-1 Pedregal - Majes, Arequipa', phone: '51 951 361 224 / 949221720' },
      { label: 'Oficina Majes', value: 'Calle Municipal Mz. I Lote 9 El Pedregal - Arequipa', phone: '51 987 066 652' },
      { label: 'Oficina Arequipa', value: 'Calle Manuel Ugarteche 207, Selva Alegre', phone: '054-209978' },
    ],
    email: 'info@idema.edu.pe',
  },
}
