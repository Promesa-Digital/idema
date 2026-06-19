/**
 * sync-culqi-links.mjs
 *
 * Consulta la API de Culqi para obtener los UUID de suscripción de cada plan
 * y actualiza el campo `culqiLink` en src/data/programs/cursos.ts.
 *
 * Uso:
 *   node scripts/sync-culqi-links.mjs
 *
 * Requiere en .env:
 *   CULQI_SECRET_KEY=sk_live_xxxx
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Leer .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(resolve(ROOT, '.env'), 'utf-8')
    return Object.fromEntries(
      content
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
        .map(l => {
          const [k, ...rest] = l.split('=')
          return [k.trim(), rest.join('=').trim().replace(/^["']|["']$/g, '')]
        })
    )
  } catch {
    return {}
  }
}

const env = { ...loadEnv(), ...process.env }
const SECRET_KEY = env.CULQI_SECRET_KEY

if (!SECRET_KEY) {
  console.error('\n❌  Falta CULQI_SECRET_KEY en .env')
  process.exit(1)
}

// ── Mapeo manual: slug del curso → fragmento único del nombre del plan en Culqi ──
// null = no tiene plan en Culqi o es ambiguo (no se toca)
const SLUG_TO_PLAN_FRAGMENT = {
  // Agropecuaria (AG)
  'biologia-agropecuaria':           '001AG',
  'botanica-fisiologia-vegetal':     '002AG',
  'anatomia-fisiologia-animal':      '003AG',
  'preparacion-de-terrenos':         '004AG',
  'produccion-de-pastos':            '005AG',
  'alimentacion-nutricion-animal':   '006AG',
  'produccion-cereales-leguminosas': '007AG',
  'produccion-de-tuberosas':         '008AG',
  'produccion-de-aves':              '009AG',
  'produccion-de-cuyes':             '010AG',
  'inseminacion-artificial':         '029AG',

  // Enfermería (ENF)
  'biologia-general':                '001ENF',
  'anatomia-funcional':              '002ENF',
  'primeros-auxilios':               '003ENF',
  'terminologia-en-salud':           '004ENF',
  'educacion-para-la-salud':         '005ENF',
  'salud-publica':                   '006ENF',
  'actividades-salud-comunitaria':   '007ENF',
  'asistencia-en-inmunizaciones':    '008ENF',
  'documentacion-en-salud':          '009ENF',
  'bioseguridad':                    '010ENF',
  'asistencia-al-usuario-oncologico':'025ENF',
  'fisioterapia-y-rehabilitacion':   '028ENF',
  'salud-bucal':                     '029ENF',

  // Sin plan en Culqi o ambiguo — no se modifican
  'clasificacion-de-medicamentos':    null,
  'atencion-cliente-centros-veterinarios': null,
  'certificados-y-firmas-digitales':  null,
  'facturacion-electronica-sunat':    null,
  'mecanizacion-agricola':            null,
  'planeacion-y-organizacion':        null,
  'document-controller':              null,
}

// ── Normalizar texto para comparación ─────────────────────────────────────
function norm(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ── Llamar API de Culqi ────────────────────────────────────────────────────
async function culqiFetch(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`${res.status} @ ${url}\n   ${body.slice(0, 300)}`)
  return JSON.parse(body)
}

// ── Actualizar culqiLink dentro del bloque de UN curso ─────────────────────
// Extrae el bloque del objeto, opera solo dentro de él, y lo devuelve.
function setCulqiLink(fileContent, slug, link) {
  // Encontrar la posición del slug en el archivo
  const slugStr = `slug: '${slug}'`
  const slugIdx = fileContent.indexOf(slugStr)
  if (slugIdx === -1) {
    console.warn(`   ⚠️  slug '${slug}' no encontrado en cursos.ts`)
    return fileContent
  }

  // Encontrar el inicio del objeto contenedor (buscar hacia atrás: `  {\n`)
  const blockStart = fileContent.lastIndexOf('  {\n', slugIdx)
  // Encontrar el fin del objeto contenedor (buscar hacia adelante: `\n  },`)
  const blockEndMarker = fileContent.indexOf('\n  },', slugIdx)
  if (blockStart === -1 || blockEndMarker === -1) {
    console.warn(`   ⚠️  No se pudo delimitar el bloque para '${slug}'`)
    return fileContent
  }
  const blockEnd = blockEndMarker + 5 // incluir `\n  },`

  let block = fileContent.slice(blockStart, blockEnd)

  // Si ya existe culqiLink en este bloque, actualizarlo
  if (block.includes('culqiLink:')) {
    block = block.replace(/culqiLink:\s*'[^']*'/, `culqiLink: '${link}'`)
  } else {
    // Insertar después del campo `price`
    const priceRe = /(    price:\s*'[^']*')(,?)(\n)/
    if (priceRe.test(block)) {
      block = block.replace(priceRe, `$1$2$3    culqiLink: '${link}',\n`)
    } else {
      // Fallback: insertar después del campo `slug`
      const slugLineRe = new RegExp(`(    slug:\\s*'${slug}')(,?)(\\n)`)
      block = block.replace(slugLineRe, `$1$2$3    culqiLink: '${link}',\n`)
    }
  }

  return fileContent.slice(0, blockStart) + block + fileContent.slice(blockEnd)
}

// ── MAIN ───────────────────────────────────────────────────────────────────
const masked = SECRET_KEY.slice(0, 10) + '...' + SECRET_KEY.slice(-4)
console.log(`\n🔑  Usando key: ${masked}`)
console.log(`   Tipo: ${SECRET_KEY.startsWith('sk_live') ? 'LIVE ✅' : SECRET_KEY.startsWith('sk_test') ? 'TEST ✅' : 'desconocido ⚠️'}`)
console.log('\n🔍  Cargando todos los planes de Culqi...\n')

// Paginar /v2/recurrent/plans para obtener todos los planes
const from = 1000000000
const to   = 9999999999
let plans = []
let nextUrl = `https://api.culqi.com/v2/recurrent/plans?creation_date_from=${from}&creation_date_to=${to}&limit=100`

while (nextUrl) {
  const json = await culqiFetch(nextUrl)
  const page = Array.isArray(json.data) ? json.data
             : Array.isArray(json)      ? json
             : json.data ? [json.data]  : []
  plans.push(...page)
  console.log(`   Página: +${page.length} (total: ${plans.length})`)

  const pagingNext  = json.paging?.next ?? null
  const cursorAfter = json.cursors?.after ?? null

  if (pagingNext) nextUrl = pagingNext
  else if (cursorAfter) nextUrl = `https://api.culqi.com/v2/recurrent/plans?creation_date_from=${from}&creation_date_to=${to}&limit=100&after=${cursorAfter}`
  else nextUrl = null

  if (plans.length >= 500) break
}

console.log(`\n✅  ${plans.length} planes cargados.\n`)

// Construir índice: nombre normalizado → plan
const planIndex = {}
for (const p of plans) {
  const key = norm(p.name ?? p.short_name ?? '')
  planIndex[key] = p
}

// Leer cursos.ts
const cursosPath = resolve(ROOT, 'src/data/programs/cursos.ts')
let cursosContent = readFileSync(cursosPath, 'utf-8')

console.log('🔗  Emparejando cursos con planes y obteniendo UUIDs...\n')

let updated = 0
let skipped = 0
let notFound = 0

for (const [courseSlug, fragment] of Object.entries(SLUG_TO_PLAN_FRAGMENT)) {
  if (fragment === null) {
    skipped++
    continue
  }

  // Buscar el plan cuyo nombre contenga el fragmento
  const normFrag = norm(fragment)
  let plan = null
  for (const [key, p] of Object.entries(planIndex)) {
    if (key.includes(normFrag)) { plan = p; break }
  }

  if (!plan) {
    console.log(`   ⚠️  ${courseSlug.padEnd(42)} sin plan para "${fragment}"`)
    notFound++
    continue
  }

  // Obtener el UUID (slug) del plan via endpoint individual
  let uuid = null
  try {
    const detail = await culqiFetch(`https://api.culqi.com/v2/recurrent/plans/${plan.id}`)
    uuid = detail.slug ?? null
  } catch (e) {
    console.error(`   ❌  ${courseSlug}: error al obtener plan — ${e.message}`)
    notFound++
    continue
  }

  if (!uuid || uuid === 'undefined') {
    console.log(`   ⚠️  ${courseSlug.padEnd(42)} plan "${plan.name}" sin slug UUID`)
    notFound++
    continue
  }

  const link = `https://subscriptions.culqi.com/onboarding?id=${uuid}`
  console.log(`   ✅  ${courseSlug.padEnd(42)} ${plan.name} → ${uuid}`)
  cursosContent = setCulqiLink(cursosContent, courseSlug, link)
  updated++
}

writeFileSync(cursosPath, cursosContent, 'utf-8')

console.log(`
✅  cursos.ts actualizado.
   Actualizados: ${updated}
   Sin plan:     ${skipped}
   No encontrados: ${notFound}
`)
