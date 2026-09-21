import { carreras } from '../src/data/programs/carreras.ts'
import { auxiliares } from '../src/data/programs/auxiliares.ts'
import { especializaciones } from '../src/data/programs/especializaciones.ts'
import { cursos } from '../src/data/programs/cursos.ts'

const apiUrl = (process.env.IDEMA_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const correo = process.env.IDEMA_ADMIN_EMAIL || 'demo.admin_sistema@idema.pe'
const password = process.env.IDEMA_ADMIN_PASSWORD || 'Demo1234!'

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  if (!response.ok) throw new Error(`${response.status} ${path}: ${await response.text()}`)
  return response.json()
}

function amount(value) {
  if (!value) return null
  const normalized = String(value).replace(/[^0-9,]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function programaPayload(programa, index) {
  const prefixes = { carrera: 'CAR', auxiliar: 'AUX', especializacion: 'ESP', curso: 'CUR' }
  return {
    codigo: `${prefixes[programa.category]}${String(index + 1).padStart(3, '0')}`,
    abreviatura: programa.shortTitle || programa.title.slice(0, 50),
    nombre: programa.title,
    slug: programa.slug,
    nombre_corto: programa.shortTitle || null,
    tipo: programa.category,
    categoria: programa.category,
    malla: programa.mallaCurricular?.length ? `${programa.mallaCurricular.length} periodos` : 'Plan de estudios',
    descripcion: programa.description || null,
    subtitulo: programa.subtitle || null,
    duracion: programa.duration || null,
    modalidad: programa.modality || null,
    imagen_url: programa.image || null,
    dirigido_a: programa.dirigidoA || null,
    contenidos: programa.features || [],
    campo_laboral: programa.campoLaboral || [],
    malla_curricular: programa.mallaCurricular || [],
    requisitos: programa.requirements || [],
    certificaciones: programa.certification || [],
    mensaje_whatsapp: programa.whatsappMessage || null,
    titulacion: programa.titulacion || null,
    malla_imagen_url: programa.mallaCurricularImage || null,
    convenio_nombre: programa.convenio?.name || null,
    convenio_logo_url: programa.convenio?.logo || null,
    seo_titulo: `${programa.title} - Instituto IDEMA`,
    seo_descripcion: programa.description || null,
    anio: new Date().getFullYear(),
    num_lecciones: programa.features?.length || 0,
    certificado: Boolean(programa.certification?.length || programa.titulacion),
    tutor: null,
    estado: 'publicado',
    publicacion_programada: null,
  }
}

function conceptos(programa, programaId) {
  const items = []
  const add = (tipo, value, modalidad = null, enlacePago = null) => {
    const monto = amount(value)
    if (monto === null) return
    items.push({
      tipo,
      monto,
      modalidad,
      enlace_pago: enlacePago,
      descripcion: modalidad ? `${tipo} - ${modalidad}` : programa.title,
      programa_id: programaId,
    })
  }
  add('matricula', programa.matricula)
  add(programa.category === 'curso' ? 'curso' : 'pension', programa.price, null, programa.culqiLink || null)
  add('pension', programa.priceVirtual, 'Virtual')
  add('pension', programa.priceSemipresencial, 'Semipresencial')
  add('pension', programa.pricePresencial, 'Presencial')
  return items
}

const catalogo = [...carreras, ...auxiliares, ...especializaciones, ...cursos]
const tokenData = await request('/api/v1/auth/login/staff', {
  body: { correo, password },
  method: 'POST',
})
const token = tokenData.access_token
const existentes = await request('/api/v1/programas/', { token })
let conceptosExistentes = await request('/api/v1/conceptos-cobro/', { token })

for (const [index, programa] of catalogo.entries()) {
  const payload = programaPayload(programa, index)
  const existente = existentes.find((item) => item.codigo === payload.codigo)
  const guardado = existente
    ? await request(`/api/v1/programas/${existente.id}`, {
        method: 'PATCH',
        token,
        body: Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'codigo')),
      })
    : await request('/api/v1/programas/', { method: 'POST', token, body: payload })

  for (const concepto of conceptos(programa, guardado.id)) {
    const existenteConcepto = conceptosExistentes.find(
      (item) => item.programa_id === guardado.id
        && item.tipo === concepto.tipo
        && (item.modalidad || null) === concepto.modalidad,
    )
    if (existenteConcepto) {
      await request(`/api/v1/conceptos-cobro/${existenteConcepto.id}`, {
        method: 'PATCH',
        token,
        body: concepto,
      })
    } else {
      const creado = await request('/api/v1/conceptos-cobro/', {
        method: 'POST',
        token,
        body: concepto,
      })
      conceptosExistentes = [...conceptosExistentes, creado]
    }
  }
}

console.log(`Catálogo sincronizado: ${catalogo.length} programas publicados.`)
