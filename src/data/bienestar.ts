import { FaStethoscope, FaHandsHelping, FaBrain } from 'react-icons/fa'
import type { IconType } from 'react-icons'

export const UBICACION_BIENESTAR = 'Urb. Las Malvinas U-1 Pedregal Norte'
export const HORARIO_BIENESTAR = 'Lunes a viernes, 9:00 am–1:00 pm y 3:00 pm–7:00 pm'

export interface AreaItem {
  label: string
  text?: string
  subItems?: { label: string; text: string }[]
}

export interface AreaAccion {
  title: string
  items: AreaItem[]
}

export interface ServicioBienestar {
  slug: string
  icon: IconType
  title: string
  resumen: string
  intro: string
  areas: AreaAccion[]
}

export const serviciosBienestar: ServicioBienestar[] = [
  {
    slug: 'medico',
    icon: FaStethoscope,
    title: 'Servicio Médico (Tópico)',
    resumen:
      'Atención médica primaria y de primeros auxilios para toda la comunidad estudiantil, con un enfoque en la salud preventiva y el bienestar físico.',
    intro:
      'Está diseñado para brindar atención médica primaria, preventiva y de primera respuesta a la comunidad educativa (estudiantes, docentes y personal administrativo). Sus servicios se organizan en las siguientes áreas principales:',
    areas: [
      {
        title: 'Atención Médica Primaria y Primeros Auxilios',
        items: [
          { label: 'Primeros Auxilios y Emergencias', text: 'Atención inmediata ante accidentes, caídas, quemaduras leves, cortes, desmayos o crisis hipertensivas dentro del campus.' },
          { label: 'Evaluación Médica Básica', text: 'Diagnóstico y tratamiento de dolencias comunes y de baja complejidad (dolores de cabeza, afecciones gastrointestinales, fiebres, alergias, resfríos).' },
          { label: 'Administración de Medicamentos', text: 'Aplicación de medicamentos ambulatorios prescritos o sintomáticos básicos (analgésicos, antiespasmódicos, antihistamínicos) con debida ficha médica.' },
          { label: 'Curaciones y Procedimientos', text: 'Limpieza de heridas, cambio de vendajes, retiro de puntos e inyectables.' },
          { label: 'Estabilización y Traslado', text: 'Triaje rápido para estabilizar pacientes en caso de emergencias graves y coordinación para su traslado a un centro hospitalario o clínica.' },
        ],
      },
      {
        title: 'Salud Preventiva y Prevención de Riesgos',
        items: [
          { label: 'Control de Funciones Vitales', text: 'Medición de presión arterial, temperatura, saturación de oxígeno, pulso, peso y talla.' },
          { label: 'Campañas de Vacunación', text: 'Coordinación con el sistema de salud público para aplicar vacunas de calendario o refuerzos (tétanos, influenza, hepatitis B, COVID-19).' },
          {
            label: 'Servicios de Tópico Estudiantil',
            subItems: [
              { label: 'Exámenes Médicos de Ingreso', text: 'Evaluación del estado de salud general de los alumnos nuevos.' },
              { label: 'Exámenes Aptitudinales', text: 'Certificados de salud para actividades deportivas, talleres o prácticas de laboratorio.' },
            ],
          },
          { label: 'Prevención de Enfermedades', text: 'Charlas e infografías sobre salud ergonómica, nutrición, prevención de enfermedades infectocontagiosas y postura.' },
        ],
      },
      {
        title: 'Orientación, Promoción de Salud y Bienestar',
        items: [
          { label: 'Educación Sexual y Reproductiva', text: 'Consejería sobre métodos anticonceptivos, prevención de Enfermedades de Transmisión Sexual (ETS) e higiene personal.' },
          { label: 'Primeros Auxilios Psicológicos (Triaje Emocional)', text: 'Canalización inicial y contención básica en casos de ataques de pánico, estrés agudo o ansiedad previa a la derivación con el área de psicología o bienestar universitario.' },
          { label: 'Orientación Nutricional Básica', text: 'Guías generales de alimentación saludable para el rendimiento académico.' },
        ],
      },
      {
        title: 'Gestión Operativa y Control Sanitario',
        items: [
          { label: 'Registro e Historial Médico', text: 'Elaboración y archivo de fichas médicas individuales de los estudiantes (con registro de alergias, enfermedades crónicas y contactos de emergencia).' },
          { label: 'Supervisión de Botiquines', text: 'Equipamiento y control de vencimiento de suministros en botiquines distribuidos en laboratorios, canchas deportivas y talleres.' },
        ],
      },
    ],
  },
  {
    slug: 'social',
    icon: FaHandsHelping,
    title: 'Servicio Social',
    resumen:
      'Apoyo socioeconómico, orientación sobre becas y beneficios, y acompañamiento familiar para facilitar la inclusión y permanencia de nuestros estudiantes.',
    intro:
      'Tiene como objetivo principal evaluar, orientar y brindar soporte integral ante dificultades socioeconómicas, familiares o personales que puedan afectar el bienestar y rendimiento del estudiante. Sus funciones y servicios clave se estructuran en las siguientes áreas:',
    areas: [
      {
        title: 'Gestión de Becas y Apoyo Económico',
        items: [
          { label: 'Evaluación Socioeconómica', text: 'Realización de entrevistas y visitas domiciliarias (si aplica) para verificar la situación socioeconómica de los estudiantes.' },
          { label: 'Administración de Beneficios', text: 'Tramitación, categorización y asignación de escalas de pago, categorizaciones socioeconómicas, becas por rendimiento, becas de orfandad o subvenciones económicas directas.' },
          { label: 'Seguimiento a Becarios', text: 'Monitoreo del cumplimiento de los requisitos exigidos para mantener o renovar los beneficios económicos concedidos.' },
        ],
      },
      {
        title: 'Orientación, Consejería y Apoyo Familiar',
        items: [
          { label: 'Atención y Orientación Social', text: 'Espacio de escucha activa y orientación individual para abordar problemáticas personales, familiares o de convivencia que interfieran con los estudios.' },
          { label: 'Intervención en Crisis Familiar', text: 'Asistencia e intermediación básica en casos de violencia familiar, vulnerabilidad económica severa, pérdida de empleo o fallecimiento del apoderado.' },
          { label: 'Derivación Oportuna', text: 'Canalización hacia instituciones públicas externas (Ministerio de la Mujer, centros de salud mental comunitaria, DEMUNA, fiscalía) ante casos que requieran atención legal o médica especializada.' },
        ],
      },
      {
        title: 'Inclusión, Diversidad y Accesibilidad',
        items: [
          { label: 'Soporte para Estudiantes con Discapacidad (NEAE)', text: 'Detección de barreras socioambientales e implementación de ajustes razonables en la institución para garantizar accesibilidad.' },
          { label: 'Integración Sociocultural', text: 'Programas de apoyo y adaptabilidad socioeducativa para estudiantes provenientes de zonas rurales, de bajos recursos o de comunidades originarias.' },
          { label: 'Lucha contra la Deserción', text: 'Identificación temprana de alumnos en riesgo de abandono escolar o universitario debido a condicionantes socioeconómicas para ofrecer alternativas de continuidad.' },
        ],
      },
      {
        title: 'Bienestar y Voluntariado Comunitario',
        items: [
          { label: 'Programas de Proyección e Impacto Social', text: 'Organización y coordinación de campañas de voluntariado, donaciones o trabajo comunitario para la sensibilización de la comunidad estudiantil.' },
          { label: 'Seguros e Infortunio', text: 'Gestión del Seguro Integral de Salud (SIS) u otros seguros de accidentes estudiantiles y apoyo técnico en los trámites de cobertura por infortunio o invalidez.' },
          { label: 'Talleres y Charlas Formativas', text: 'Capacitación sobre equidad de género, prevención de la violencia, manejo de presupuestos familiares y resolución de conflictos.' },
        ],
      },
    ],
  },
  {
    slug: 'psicopedagogico',
    icon: FaBrain,
    title: 'Servicio Psicopedagógico',
    resumen:
      'Diagnóstico de estilos de aprendizaje, hábitos de estudio, orientación vocacional y soporte emocional para acompañar tu desarrollo académico.',
    intro:
      'Es el área encargada de optimizar el proceso de enseñanza y aprendizaje, interviniendo de manera integral en los factores cognitivos, emocionales y metodológicos que influyen en el rendimiento académico y la adaptación a la vida estudiantil. Sus funciones y servicios principales se estructuran en cuatro grandes líneas de acción:',
    areas: [
      {
        title: 'Diagnóstico e Intervención en el Aprendizaje',
        items: [
          { label: 'Evaluación Psicopedagógica', text: 'Identificación de dificultades específicas en el aprendizaje (problemas de comprensión lectora, memoria, concentración, hábitos de estudio o razonamiento).' },
          { label: 'Planes de Apoyo Pedagógico', text: 'Diseño e implementación de estrategias metodológicas personalizadas o adaptaciones para superar los bloqueos o vacíos académicos.' },
          { label: 'Tutoría e Intervención Individual', text: 'Acompañamiento directo al estudiante para desarrollar su autonomía, metacognición y estrategias de autoestudio.' },
        ],
      },
      {
        title: 'Desarrollo de Habilidades y Hábitos de Estudio',
        items: [
          { label: 'Taller de Técnicas de Estudio', text: 'Capacitación en organización del tiempo, toma de apuntes, elaboración de mapas conceptuales, preparación para exámenes y lectura crítica.' },
          { label: 'Gestión del Tiempo y Planificación', text: 'Asesoría práctica para equilibrar la carga académica con la vida personal y laboral, evitando la procrastinación.' },
          { label: 'Acompañamiento en el Rendimiento Bajo', text: 'Seguimiento continuo e intensivo a estudiantes en riesgo de desaprobación o en condición de reserva/prueba académica.' },
        ],
      },
      {
        title: 'Orientación Vocacional y Profesional',
        items: [
          { label: 'Reorientación Vocacional', text: 'Evaluación y asesoramiento para estudiantes que dudan sobre su elección de carrera o contemplan cambios de especialidad o curso.' },
          { label: 'Proceso de Transición a la Vida Estudiantil', text: 'Estrategias para facilitar la adaptación de los estudiantes ingresantes al ritmo exigido por la institución.' },
          { label: 'Desarrollo de Habilidades Blandas', text: 'Talleres de comunicación asertiva, resolución de problemas y trabajo en equipo aplicados al ámbito académico.' },
        ],
      },
      {
        title: 'Soporte Emocional para el Rendimiento',
        items: [
          { label: 'Manejo de la Ansiedad ante Exámenes', text: 'Terapia breve y técnicas de autocontrol para disminuir el estrés, el pánico escénico y los bloqueos emocionales durante evaluaciones o exposiciones.' },
          { label: 'Orientación Personal Ligada al Estudio', text: 'Espacio de escucha para abordar factores emocionales (desmotivación, baja autoestima académica o frustración) que impacten en el desempeño.' },
          { label: 'Derivación Especializada', text: 'Canalización externa a psicología clínica o psiquiatría en caso de detectar afecciones de salud mental que sobrepasen el ámbito psicopedagógico.' },
        ],
      },
    ],
  },
]

export function getServicioBienestar(slug: string | undefined): ServicioBienestar | undefined {
  return serviciosBienestar.find(s => s.slug === slug)
}
