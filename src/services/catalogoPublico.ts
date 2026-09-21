import { listarConceptosPublicos } from '@/services/conceptosApi'
import { listarProgramasPublicos } from '@/services/programasApi'
import type { ConceptoCobroBackend, ProgramaBackend } from '@/types/backend'
import type { Carrera } from '@/types'

function formatPrice(value: string): string {
  const amount = Number(value)
  return `S/.${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

function finalAmount(concepto: ConceptoCobroBackend): string {
  return concepto.monto_final || concepto.monto
}

function originalAmount(concepto: ConceptoCobroBackend): string | undefined {
  return concepto.porcentaje_descuento ? concepto.monto_original || concepto.monto : undefined
}

function discountPercent(concepto: ConceptoCobroBackend): number | undefined {
  return concepto.porcentaje_descuento ? Number(concepto.porcentaje_descuento) : undefined
}

function findConcept(
  conceptos: ConceptoCobroBackend[],
  programaId: string,
  tipo: ConceptoCobroBackend['tipo'],
  modalidad?: string,
): ConceptoCobroBackend | undefined {
  return conceptos.find((concepto) =>
    concepto.programa_id === programaId
      && concepto.tipo === tipo
      && (modalidad === undefined || concepto.modalidad?.toLowerCase() === modalidad.toLowerCase()),
  )
}

function toPublicProgram(programa: ProgramaBackend, conceptos: ConceptoCobroBackend[]): Carrera {
  const conceptoPrincipal = findConcept(
    conceptos,
    programa.id,
    programa.tipo === 'curso' ? 'curso' : 'pension',
  )
  const matricula = findConcept(conceptos, programa.id, 'matricula')
  const virtual = findConcept(conceptos, programa.id, 'pension', 'virtual')
  const semipresencial = findConcept(conceptos, programa.id, 'pension', 'semipresencial')
  const presencial = findConcept(conceptos, programa.id, 'pension', 'presencial')
  const gratuito = findConcept(conceptos, programa.id, 'gratuito')
  const enlacePago = conceptoPrincipal?.enlace_pago
    || virtual?.enlace_pago
    || semipresencial?.enlace_pago
    || presencial?.enlace_pago

  return {
    slug: programa.slug,
    title: programa.nombre,
    shortTitle: programa.nombre_corto || programa.abreviatura,
    duration: programa.duracion || 'Consultar duración',
    modality: programa.modalidad || 'Consultar modalidad',
    description: programa.descripcion || '',
    dirigidoA: programa.dirigido_a || undefined,
    image: programa.imagen_url || '/assets/img/programs/cursos.webp',
    category: programa.tipo,
    features: programa.contenidos,
    campoLaboral: programa.campo_laboral,
    mallaCurricular: programa.malla_curricular,
    whatsappMessage: programa.mensaje_whatsapp || undefined,
    price: conceptoPrincipal ? formatPrice(finalAmount(conceptoPrincipal)) : gratuito ? 'S/.0' : undefined,
    priceOriginal: conceptoPrincipal && originalAmount(conceptoPrincipal) ? formatPrice(originalAmount(conceptoPrincipal)!) : undefined,
    discountPercent: conceptoPrincipal ? discountPercent(conceptoPrincipal) : undefined,
    priceVirtual: virtual ? formatPrice(finalAmount(virtual)) : undefined,
    priceVirtualOriginal: virtual && originalAmount(virtual) ? formatPrice(originalAmount(virtual)!) : undefined,
    discountVirtualPercent: virtual ? discountPercent(virtual) : undefined,
    priceSemipresencial: semipresencial ? formatPrice(finalAmount(semipresencial)) : undefined,
    priceSemipresencialOriginal: semipresencial && originalAmount(semipresencial) ? formatPrice(originalAmount(semipresencial)!) : undefined,
    discountSemipresencialPercent: semipresencial ? discountPercent(semipresencial) : undefined,
    pricePresencial: presencial ? formatPrice(finalAmount(presencial)) : undefined,
    pricePresencialOriginal: presencial && originalAmount(presencial) ? formatPrice(originalAmount(presencial)!) : undefined,
    discountPresencialPercent: presencial ? discountPercent(presencial) : undefined,
    matricula: matricula ? formatPrice(finalAmount(matricula)) : undefined,
    matriculaOriginal: matricula && originalAmount(matricula) ? formatPrice(originalAmount(matricula)!) : undefined,
    discountMatriculaPercent: matricula ? discountPercent(matricula) : undefined,
    requirements: programa.requisitos,
    certification: programa.certificaciones,
    titulacion: programa.titulacion || undefined,
    mallaCurricularImage: programa.malla_imagen_url || undefined,
    subtitle: programa.subtitulo || undefined,
    convenio: programa.convenio_nombre
      ? { name: programa.convenio_nombre, logo: programa.convenio_logo_url || '/assets/img/logos/idema-logo.webp' }
      : undefined,
    culqiLink: enlacePago || undefined,
  }
}

export async function cargarCatalogoPublico(): Promise<Carrera[]> {
  const [programas, conceptos] = await Promise.all([
    listarProgramasPublicos(),
    listarConceptosPublicos(),
  ])
  return programas.map((programa) => toPublicProgram(programa, conceptos))
}
