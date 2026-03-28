import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'

const termsContent = [
  {
    title: 'TÉRMINOS Y CONDICIONES DEL SERVICIO EDUCATIVO',
    subtitle: 'INSTITUTO DE EDUCACIÓN SUPERIOR IDEMA',
    intro: `Los presentes Términos y Condiciones del Servicio Educativo regulan el acceso, uso y prestación de los servicios académicos brindados por el Instituto de Educación Superior IDEMA, en adelante la Institución, entidad dedicada a la formación académica, técnica y profesional mediante programas de educación superior, capacitación continua y actividades formativas complementarias.

La matrícula, inscripción o participación en cualquiera de los programas académicos ofrecidos por la Institución implica la aceptación expresa, libre e informada de los presentes términos y condiciones por parte del estudiante, usuario o participante.

Los presentes términos se aplican sin perjuicio de lo dispuesto en la normativa educativa vigente emitida por el Ministerio de Educación del Perú, así como de las disposiciones contenidas en la Ley N.° 30512 y la Ley N.° 29733.`,
  },
  {
    title: '1. Objeto del servicio educativo',
    content: `La Institución brinda servicios educativos orientados a la formación académica, técnica y profesional, a través de programas de estudio, cursos de especialización, capacitaciones, talleres, seminarios y otras actividades formativas destinadas al desarrollo de competencias profesionales de los estudiantes.

Los servicios educativos podrán desarrollarse en modalidad presencial, virtual o mixta, según la naturaleza del programa académico y las disposiciones institucionales vigentes.`,
  },
  {
    title: '2. Matrícula e inscripción',
    content: `La matrícula o inscripción en cualquiera de los programas académicos ofrecidos por la Institución implica la aceptación expresa de los presentes términos y condiciones, así como de:`,
    bullets: [
      'Los reglamentos institucionales.',
      'Las normas académicas vigentes.',
      'Las disposiciones administrativas aplicables.',
    ],
    extra: `El estudiante deberá proporcionar información veraz, completa y actualizada durante el proceso de inscripción. La Institución se reserva el derecho de verificar la información proporcionada y solicitar la documentación correspondiente.

En caso de detectarse información falsa, incompleta o incorrecta, la Institución podrá suspender o anular la matrícula del estudiante.`,
  },
  {
    title: '3. Obligaciones del estudiante',
    content: 'El estudiante se compromete a:',
    bullets: [
      'Cumplir con las normas académicas, administrativas y disciplinarias establecidas por la Institución.',
      'Mantener una conducta respetuosa hacia docentes, personal administrativo y demás estudiantes.',
      'Participar activamente en las actividades académicas programadas.',
      'Cumplir con los requisitos de asistencia, evaluaciones y trabajos académicos.',
      'Utilizar adecuadamente los recursos educativos proporcionados por la Institución.',
    ],
    extra: 'El incumplimiento de estas obligaciones podrá generar medidas disciplinarias conforme a los reglamentos institucionales.',
  },
  {
    title: '4. Uso de plataformas y recursos académicos',
    content: `La Institución podrá proporcionar acceso a plataformas virtuales, sistemas educativos digitales, material académico electrónico y recursos tecnológicos destinados al desarrollo de las actividades formativas.

El estudiante se compromete a utilizar dichos recursos exclusivamente con fines académicos, quedando estrictamente prohibido:`,
    bullets: [
      'Compartir credenciales de acceso con terceros.',
      'Copiar, reproducir o distribuir el material académico sin autorización.',
      'Utilizar las plataformas para fines distintos a los educativos.',
    ],
    extra: 'La Institución podrá suspender el acceso a las plataformas en caso de uso indebido o incumplimiento de las normas institucionales.',
  },
  {
    title: '5. Pagos y obligaciones económicas',
    content: `El estudiante se compromete a cumplir con el cronograma de pagos establecido por la Institución respecto de los servicios educativos contratados.

Los pagos deberán realizarse mediante los medios de pago autorizados por la Institución.

El incumplimiento o retraso en el pago de las obligaciones económicas podrá generar:`,
    bullets: [
      'Suspensión temporal del acceso a clases.',
      'Bloqueo de plataformas virtuales.',
      'Restricción para rendir evaluaciones.',
      'Suspensión de servicios académicos o administrativos.',
    ],
    extra: 'La reactivación de los servicios se realizará una vez regularizada la obligación económica pendiente.',
  },
  {
    title: '6. Modificación de precios',
    content: `La Institución se reserva el derecho de modificar los costos de los programas académicos, cursos o servicios educativos, cuando existan razones administrativas, operativas o académicas que lo justifiquen.

Dichos cambios serán comunicados oportunamente a los estudiantes mediante los canales institucionales oficiales.`,
  },
  {
    title: '7. Modificación de horarios, docentes o modalidad educativa',
    content: 'La Institución se reserva el derecho de realizar modificaciones en:',
    bullets: [
      'Horarios de clases',
      'Asignación de docentes',
      'Metodologías de enseñanza',
      'Modalidad educativa (presencial o virtual)',
    ],
    extra: `cuando circunstancias académicas, administrativas o de caso fortuito o fuerza mayor lo requieran.

Estas modificaciones no generarán derecho a devolución de pagos ni compensaciones económicas.`,
  },
  {
    title: '8. Abandono del programa académico',
    content: `En caso de que el estudiante decida abandonar el programa académico, curso o capacitación, ello no lo exime del cumplimiento de las obligaciones económicas asumidas con la Institución.

La falta de asistencia o abandono voluntario de las clases no genera derecho a devolución de dinero ni a la anulación automática de las obligaciones de pago pendientes.`,
  },
  {
    title: '9. Política de reembolsos',
    content: `Las solicitudes de devolución o reembolso deberán presentarse formalmente mediante los canales administrativos establecidos por la Institución.

Las solicitudes presentadas dentro de los primeros tres (3) días calendario desde la realización del pago podrán acceder a un reembolso de hasta el cincuenta por ciento (50%) del monto pagado, previa evaluación administrativa.

Las solicitudes presentadas después de los tres (3) días calendario desde la realización del pago no serán sujetas a reembolso.

No se realizarán devoluciones cuando el estudiante:`,
    bullets: [
      'Haya iniciado clases.',
      'Haya accedido a material académico.',
      'Haya utilizado plataformas virtuales.',
      'Haya recibido cualquier servicio educativo por parte de la Institución.',
    ],
    extra: 'Los casos excepcionales serán evaluados individualmente por la Institución, la cual se reserva el derecho de aprobar o denegar la solicitud según corresponda.',
  },
  {
    title: '10. Propiedad intelectual',
    content: `Todo el material académico, contenido educativo, documentos, presentaciones, metodologías de enseñanza, recursos digitales y demás elementos proporcionados por la Institución se encuentran protegidos por las normas de propiedad intelectual.

Queda estrictamente prohibida su reproducción, distribución, copia, modificación o uso con fines distintos a los educativos sin autorización expresa de la Institución.`,
  },
  {
    title: '11. Uso de imagen institucional',
    content: 'El estudiante autoriza a la Institución a utilizar fotografías, videos o registros audiovisuales obtenidos durante actividades académicas, eventos institucionales o actividades formativas con fines:',
    bullets: [
      'educativos,',
      'informativos,',
      'institucionales o promocionales.',
    ],
    extra: 'Dicho uso se realizará respetando la dignidad, integridad y finalidad educativa de las actividades desarrolladas.',
  },
  {
    title: '12. Protección de datos personales',
    content: `La información personal proporcionada por los estudiantes será utilizada exclusivamente para fines académicos, administrativos y de gestión institucional, en cumplimiento de la Ley N.° 29733.

El estudiante autoriza a la Institución a utilizar sus datos personales para:`,
    bullets: [
      'gestión académica,',
      'comunicación institucional,',
      'procesos administrativos,',
      'mejora de los servicios educativos.',
    ],
    extra: 'La Institución se compromete a implementar medidas de seguridad adecuadas para proteger la confidencialidad de los datos personales.',
  },
  {
    title: '13. No garantía de empleabilidad',
    content: `La Institución brinda formación académica y técnica orientada al desarrollo de competencias profesionales; sin embargo, no garantiza la obtención de empleo o colocación laboral al finalizar los programas educativos.

La inserción laboral dependerá de diversos factores como el desempeño del estudiante, condiciones del mercado laboral y oportunidades profesionales disponibles.`,
  },
  {
    title: '14. Modificación de los términos y condiciones',
    content: `La Institución se reserva el derecho de modificar o actualizar los presentes términos y condiciones cuando lo considere necesario para mejorar la prestación del servicio educativo o cumplir con nuevas disposiciones legales.

Las modificaciones serán comunicadas a los estudiantes mediante los canales oficiales de la Institución.`,
  },
  {
    title: '15. Jurisdicción y ley aplicable',
    content: `Los presentes términos y condiciones se rigen por la legislación vigente de la República del Perú.

Cualquier controversia derivada de la interpretación o aplicación de este documento será resuelta conforme a la jurisdicción de los tribunales competentes de la ciudad de Arequipa.`,
  },
  {
    title: '16. Aceptación de los términos y condiciones',
    content: 'La matrícula, inscripción o utilización de los servicios educativos ofrecidos por la Institución implica la aceptación total de los presentes términos y condiciones, así como de los reglamentos internos, normas académicas y disposiciones administrativas vigentes.',
  },
]

const privacyContent = [
  {
    title: 'Política de Privacidad',
    subtitle: 'Protección de Datos Personales',
    intro: `En el Instituto IDEMA respetamos tu privacidad y nos comprometemos a proteger la información personal que nos proporciones. Esta Política de Privacidad describe cómo se recopila, utiliza y comparte la información personal de los usuarios que utilizan nuestros servicios y plataformas. Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política.

Fecha de última actualización: 2026`,
  },
  {
    title: '1. Información que Recopilamos',
    content: 'Recopilamos los siguientes tipos de información:',
    bullets: [
      'Datos de contacto (nombre, correo electrónico, teléfono)',
      'Información académica y documentación de inscripción',
      'Datos de navegación y cookies',
      'Información proporcionada en formularios de contacto e inscripción',
      'Información de uso de nuestras plataformas virtuales',
    ],
    extra: 'La información personal que recopilamos es proporcionada voluntariamente por usted al registrarse, inscribirse en programas académicos o utilizar nuestros servicios.',
  },
  {
    title: '2. Uso de la Información',
    content: 'La información personal que recopilamos puede utilizarse para:',
    bullets: [
      'Procesar su inscripción en nuestros programas educativos.',
      'Gestión académica y administrativa.',
      'Comunicarnos con usted sobre nuestros servicios, actualizaciones y notificaciones.',
      'Personalizar su experiencia dentro de nuestras plataformas.',
      'Mejorar nuestros programas y servicios educativos.',
      'Realizar análisis y estudios para comprender mejor las necesidades de nuestros estudiantes.',
      'Cumplir con obligaciones legales.',
    ],
  },
  {
    title: '3. Protección de Datos',
    content: 'Implementamos medidas de seguridad para proteger sus datos personales:',
    bullets: [
      'Encriptación SSL en todas nuestras plataformas.',
      'Acceso restringido a información personal.',
      'Copias de seguridad periódicas.',
      'Monitoreo continuo de seguridad.',
    ],
    extra: 'Tomamos medidas razonables para proteger la información personal de los usuarios. Sin embargo, ninguna transmisión de datos por Internet o sistema de almacenamiento es completamente seguro.',
  },
  {
    title: '4. Compartir Información con Terceros',
    content: 'No compartiremos su información personal con terceros sin su consentimiento, excepto en los siguientes casos:',
    bullets: [
      'Con proveedores de servicios que nos ayudan a operar y mejorar nuestras plataformas.',
      'Para cumplir con requisitos legales, como una orden judicial o proceso legal similar.',
      'En caso de fusión, adquisición o reorganización institucional.',
      'Cuando sea requerido por la normativa educativa vigente.',
    ],
  },
  {
    title: '5. Cookies',
    content: 'Nuestro sitio web utiliza cookies para mejorar su experiencia de navegación. Las cookies nos permiten recordar sus preferencias y mejorar la funcionalidad del sitio. Puede controlar el uso de cookies a través de la configuración de su navegador.',
  },
  {
    title: '6. Sus Derechos',
    content: 'Usted tiene los siguientes derechos con respecto a su información personal, en cumplimiento de la Ley N.° 29733 (Ley de Protección de Datos Personales del Perú):',
    bullets: [
      'Derecho de acceso a sus datos personales.',
      'Derecho de rectificación de información incorrecta o desactualizada.',
      'Derecho de cancelación o eliminación de sus datos.',
      'Derecho de oposición al tratamiento de sus datos.',
      'Derecho a restringir el procesamiento de sus datos.',
    ],
    extra: 'Para ejercer estos derechos, puede contactarnos a través de info@idema.edu.pe.',
  },
  {
    title: '7. Cambios a la Política de Privacidad',
    content: 'Esta Política de Privacidad puede actualizarse ocasionalmente para reflejar cambios en nuestras prácticas o regulaciones. Le recomendamos revisar periódicamente esta página para mantenerse informado sobre cómo manejamos su información. Los cambios serán notificados a través de nuestros canales oficiales.',
  },
  {
    title: '8. Cumplimiento Legal',
    content: 'Cumplimos con la Ley de Protección de Datos Personales del Perú (Ley N.° 29733) y todas las normativas aplicables para garantizar la protección de su información personal.',
  },
  {
    title: '9. Contacto',
    content: 'Si tiene preguntas sobre esta Política de Privacidad, puede ponerse en contacto con nosotros:',
  },
]

export default function LegalPage() {
  const location = useLocation()
  const isPrivacy = location.pathname === '/politica-privacidad'
  const pageType = isPrivacy ? 'Política de Privacidad' : 'Términos y Condiciones'
  const sections = isPrivacy ? privacyContent : termsContent

  return (
    <>
      <Helmet>
        <title>{pageType} - Instituto IDEMA</title>
        <meta name="description" content={pageType + ' del Instituto de Educación Superior IDEMA'} />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-dark to-deep">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{pageType}</h1>
          <p className="text-sm md:text-base text-primary">Instituto de Educación Superior IDEMA</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.03 }}
              className="mb-10"
            >
              {/* Section title */}
              {index === 0 && section.subtitle ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-deep mb-2 text-center">{section.title}</h2>
                  <p className="text-lg font-semibold text-primary mb-6 text-center">{section.subtitle}</p>
                  {section.intro && (
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/30 p-6 mb-8">
                      {section.intro.split('\n\n').map((p, i) => (
                        <p key={i} className="text-deep leading-relaxed mb-3 last:mb-0">{p}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <h3 className="text-xl md:text-2xl font-bold text-deep mb-4 mt-6">{section.title}</h3>
              )}

              {/* Content paragraphs */}
              {section.content && section.content.split('\n\n').map((p, i) => (
                <p key={i} className="text-deep leading-relaxed mb-4">{p}</p>
              ))}

              {/* Bullet points */}
              {section.bullets && (
                <ul className="list-disc list-inside space-y-2 my-4 pl-4">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="text-deep leading-relaxed">{bullet}</li>
                  ))}
                </ul>
              )}

              {/* Extra content after bullets */}
              {section.extra && section.extra.split('\n\n').map((p, i) => (
                <p key={i} className="text-deep leading-relaxed mb-4">{p}</p>
              ))}
            </motion.div>
          ))}

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-primary/30"
          >
            <h2 className="text-2xl font-bold text-deep mb-4">Contacto y Consultas</h2>
            <p className="text-deep mb-4">
              Si tiene preguntas sobre {isPrivacy ? 'esta política de privacidad' : 'estos términos y condiciones'}, contáctenos:
            </p>
            <div className="space-y-2">
              <p className="text-deep">
                <strong>Correo:</strong> info@idema.edu.pe
              </p>
              <p className="text-deep">
                <strong>Teléfono:</strong> +51 951 361 224 / 054-209978
              </p>
              <p className="text-deep">
                <strong>Dirección:</strong> Urb. Las Malvinas U-1 Pedregal - Majes, Arequipa
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
