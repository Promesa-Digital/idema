import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaBullseye, FaLightbulb, FaAward, FaGraduationCap, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCertificate, FaBookOpen } from 'react-icons/fa'

export default function NosotrosPage() {
  const stats = [
    { icon: FaAward, label: 'Años de Experiencia', value: '+30' },
    { icon: FaBuilding, label: 'Carreras Técnicas', value: '5' },
    { icon: FaBookOpen, label: 'Cursos Online', value: '+250' },
  ]

  const staff = [
    { name: 'Mg. Raúl Herrera Flores', role: 'Gerente General', image: '/assets/img/team/GerenteGeneral.webp' },
    { name: 'Mg. Máximo Vidal Falcón Bellido', role: 'Director', image: '/assets/img/team/maximo-falcon.jpeg' },
    { name: 'Ing. Mario Ezequiel Chávez Cáceres', role: 'Coordinador Agropecuaria', image: '/assets/img/team/mario-chavez.jpeg' },
    { name: 'Ing. Jaime Santiago Pino Mansilla', role: 'Coordinador Prácticas Agropecuaria', image: '/assets/img/team/jaime-pino.jpeg' },
    { name: 'Lic. Deisy Huerta Huerta', role: 'Coordinador Prácticas Avanzadas', image: '/assets/img/team/deisy-huerta.jpeg' },
    { name: 'Ing. Julio Calcina', role: 'Coordinador de Gestión de la Calidad', image: '/assets/img/team/julio-calcina.jpeg' },
    { name: 'Lic. Giannina Jennifer Vásquez Quispe', role: 'Coord. Prácticas Básicas Enfermería', image: '/assets/img/team/giannina-vasquez.jpeg' },
  ]

  const teamMembers = [
    { name: 'Equipo Marketing y Publicidad', role: 'Estrategia y comunicación', image: '/assets/img/team/1marketing.webp' },
    { name: 'Equipo Ventas y Asesoría', role: 'Atención al estudiante', image: '/assets/img/team/1ventas.webp' },
    { name: 'Equipo Proyectos y Procesos', role: 'Gestión y calidad', image: '/assets/img/team/1procesos.webp' },
    { name: 'Equipo Tecnología e Innovación', role: 'Desarrollo y sistemas', image: '/assets/img/team/1developer.webp' },
  ]

  const locations = [
    { name: 'Instituto Santiago Ramón y Cajal', address: 'Urb. Las Malvinas U-1 Pedregal - Majes, Arequipa', hours: 'Lunes a Viernes 9:00 a.m. a 7:00 p.m.', phone: '951 361 224' },
    { name: 'Instituto Andrew Pietowsky (Chivay)', address: 'Chivay, Arequipa - Código modular: 1639152', hours: 'Carreras: Administración de Empresas, Contabilidad', phone: '' },
    { name: 'Oficina Majes', address: 'Calle Municipal Mz. I Lote 9 El Pedregal - Arequipa', hours: '', phone: '' },
    { name: 'Oficina Arequipa', address: 'Calle Manuel Ugarteche 207, Selva Alegre, Arequipa', hours: 'Lunes a Viernes 9:00 a.m. a 1:00 p.m. y 3:00 p.m. a 7:00 p.m. / Sábados 9:00 a.m. a 1:00 p.m.', phone: '(054) 209978' },
  ]

  return (
    <>
      <Helmet>
        <title>Sobre Nosotros - Instituto IDEMA</title>
        <meta name="description" content="Conoce más sobre el Instituto IDEMA, más de 30 años formando profesionales técnicos en Perú." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden bg-gradient-to-br from-dark to-deep">
        {/* Imagen de fondo del equipo */}
        <img
          src="/assets/img/team/equipo.webp"
          alt="Equipo IDEMA"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Overlay oscuro para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/50 to-dark/80"></div>
        {/* Efectos luminosos (sobre la imagen) */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Sobre Nosotros</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">Transformando la educación técnica desde 1994</p>
        </motion.div>
      </div>

      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* History */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Nuestra Historia</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mt-4 mb-8 sm:mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="space-y-4">
                <p className="text-lg text-deep leading-relaxed">
                  El Instituto nace el 7 de Octubre de 1994 como Instituto Superior Tecnológico "Santiago Ramón y Cajal" mediante Resoluciones Ministeriales Nro: 693-91 ED y R.M. 810-94 ED debidamente revalidado mediante R.D. Nro. 0765.ED (Código modular: 0898189).
                </p>
                <p className="text-lg text-deep leading-relaxed">
                  Desde esa fecha hemos logrado impartir educación de calidad, inclusiva y abierta, siempre promoviendo la investigación entre nuestros estudiantes y docentes. Con más de 30 años de excelencia educativa en el Perú.
                </p>
                <p className="text-lg text-deep leading-relaxed">
                  Contamos además con el Instituto Andrew Pietowsky en Chivay, Arequipa (código modular 1639152), autorizado por el Ministerio de Educación, que otorga títulos a nombre de la nación en las carreras de Administración de Empresas y Contabilidad.
                </p>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-4">
                <div className="bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl p-6 border-2 border-primary/30">
                  <p className="text-center">
                    <span className="text-5xl font-bold gradient-text">1994</span>
                  </p>
                  <p className="text-deep mt-2 text-center">Fundación del Instituto</p>
                </div>
                <div className="bg-gradient-to-br from-accent/10 to-cta/10 rounded-2xl p-6 border-2 border-accent/20">
                  <h4 className="font-bold text-deep mb-2">Resoluciones Ministeriales</h4>
                  <ul className="text-sm text-deep space-y-1">
                    <li>R.M. Nro: 693-91 ED</li>
                    <li>R.M. 810-94 ED</li>
                    <li>R.D. Nro. 0765.ED</li>
                    <li>Código modular: 0898189</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-accent/10 to-cta/10 rounded-2xl p-6 border-2 border-accent/30 flex items-center gap-4">
                  <FaCertificate className="text-3xl text-accent flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-deep">ISO 21001:2018</h4>
                    <p className="text-sm text-deep">Certificación Internacional en Gestión Educativa</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20 py-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Nuestros Logros</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>

            {/* Premio Empresa Peruana del Año */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <a
                href="https://website.instituto-idema.org/node/230"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col md:flex-row items-center gap-8 bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-10 border border-primary/20 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 group no-underline"
              >
                <img
                  src="/assets/images/idemaempresaanho.webp"
                  alt="Empresa Peruana del Año 2025"
                  className="w-40 sm:w-48 object-contain drop-shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Reconocimiento Nacional</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-deep mb-2 group-hover:text-primary transition-colors">Empresa Peruana del Año 2025</h3>
                  <p className="text-deep/70 leading-relaxed">Instituto IDEMA fue reconocido como <strong>Empresa Peruana del Año 2025</strong>, distinción que reafirma nuestro compromiso con la excelencia educativa, la formación técnica de calidad y el desarrollo sostenible de nuestra región y país.</p>
                  <p className="text-primary text-sm font-semibold mt-3 group-hover:underline">Ver noticia →</p>
                </div>
              </a>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="text-center">
                  <stat.icon className="text-4xl text-primary mx-auto mb-4" />
                  <p className="text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                  <p className="text-deep font-semibold">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Infrastructure */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Infraestructura</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mt-4 mb-8 sm:mb-12" />
            <p className="text-lg text-deep leading-relaxed mb-6">
              Ubicados en el distrito de Majes, provincia de Caylloma, departamento de Arequipa, contamos con un campus de más de 5,000 m² que incluye:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {['Campos deportivos', 'Centros de investigación', 'Laboratorios', 'Sala de cómputo', 'Tópico de enfermería', 'Auditorios'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-center">
                  <p className="text-deep font-semibold">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mission & Vision */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Misión y Visión</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-accent/10 to-cta/10 p-8 rounded-2xl border-2 border-accent/20">
                <div className="flex items-center gap-4 mb-6">
                  <FaBullseye className="text-3xl text-accent" />
                  <h3 className="text-2xl font-bold text-deep">Misión</h3>
                </div>
                <p className="text-deep leading-relaxed">
                  Formar y capacitar Profesionales Técnicos altamente competitivos y asesorar en el campo tecnológico y de gestión, apoyando al desarrollo de personas y empresas.
                </p>
              </motion.div>
              <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-2xl border-2 border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                  <FaLightbulb className="text-3xl text-accent" />
                  <h3 className="text-2xl font-bold text-deep">Visión</h3>
                </div>
                <p className="text-deep leading-relaxed">
                  Ser una Plataforma Educativa Certificada, Licenciada y Acreditada, de alcance nacional, mediante modelos flexibles, modulares, accesibles y capaces de conectar estudiantes, docentes y el sector productivo en Ciencias Agropecuarias, Salud y Gestión Empresarial. Reconocidos por la excelencia en nuestra enseñanza, formación y calidad de servicios, por el respeto que evidenciamos en todos nuestros actos y por la convicción de contribuir al desarrollo de nuestra Región y País.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Core Values */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">¿Por qué IDEMA?</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <motion.div whileHover={{ translateY: -10 }} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-center">
                <FaAward className="text-4xl text-primary mx-auto mb-4" />
                <h3 className="text-xl font-bold text-deep mb-3">Garantía</h3>
                <p className="text-deep text-sm">30 años de actividad educativa, reconocida y licenciada por el MINEDU. Otorgamos títulos a nombre de la nación y certificados oficiales.</p>
              </motion.div>
              <motion.div whileHover={{ translateY: -10 }} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-center">
                <FaCertificate className="text-4xl text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-deep mb-3">Calidad</h3>
                <p className="text-deep text-sm">Certificación ISO 21001 y metodología innovadora que garantiza calidad educativa reconocida internacionalmente.</p>
              </motion.div>
              <motion.div whileHover={{ translateY: -10 }} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-center">
                <FaGraduationCap className="text-4xl text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold text-deep mb-3">Flexibilidad</h3>
                <p className="text-deep text-sm">Modalidades presencial, semi-presencial y a distancia para adaptarnos a tus necesidades.</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Team */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Nuestro Equipo</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[...staff, ...teamMembers].map((member, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ translateY: -10 }} className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
                  <div className="h-64 overflow-hidden">
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-deep mb-2">{member.name}</h3>
                    <p className="text-primary font-semibold text-sm">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Locations */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16 sm:mb-20">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Nuestras Sedes</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {locations.map((location, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} whileHover={{ translateY: -5 }} className="bg-gradient-to-br from-cta/10 to-accent/10 p-6 rounded-2xl border-2 border-cta/20">
                  <FaMapMarkerAlt className="text-2xl text-cta mb-3" />
                  <h3 className="text-lg font-bold text-deep mb-2">{location.name}</h3>
                  <p className="text-deep text-sm mb-1">{location.address}</p>
                  {location.hours && <p className="text-deep/70 text-xs">{location.hours}</p>}
                  {location.phone && <p className="text-primary text-sm font-semibold mt-1">{location.phone}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-gradient-to-r from-primary to-dark rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Quieres Conocer Más?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Estamos aquí para responder tus preguntas y brindarte toda la información que necesitas sobre nuestros programas educativos.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
              <a href="tel:+51951361224" className="flex items-center gap-3 hover:text-primary transition-colors">
                <FaPhone className="text-2xl" />
                <div className="text-left">
                  <p className="text-sm text-white/80">Teléfono</p>
                  <p className="font-semibold">+51 951 361 224</p>
                </div>
              </a>
              <div className="hidden sm:block w-px h-16 bg-white/20"></div>
              <a href="mailto:info@idema.edu.pe" className="flex items-center gap-3 hover:text-primary transition-colors">
                <FaEnvelope className="text-2xl" />
                <div className="text-left">
                  <p className="text-sm text-white/80">Correo</p>
                  <p className="font-semibold">info@idema.edu.pe</p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
