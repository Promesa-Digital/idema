/**
 * import-culqi-csv.mjs
 *
 * Lee el reporte CSV de planes de Culqi y actualiza culqiLink en cursos.ts.
 *
 * Uso:
 *   node scripts/import-culqi-csv.mjs [ruta-al-csv]
 *
 * Si no se pasa ruta, busca el CSV en la raíz del proyecto.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Mapeo manual: slug del curso → fragmento único del nombre del plan en Culqi ──
// La clave es el slug en cursos.ts, el valor es texto que aparece en "Nombre plan" del CSV.
// Si hay ambigüedad (mismo nombre en ADM y BAN), se pone null para saltar.
const SLUG_TO_PLAN_FRAGMENT = {
  // Agropecuaria (AG)
  'biologia-agropecuaria':        '001AG-Biolog',
  'botanica-fisiologia-vegetal':  '002AG-Botanica',
  'anatomia-fisiologia-animal':   '003AG-Anatomia',
  'preparacion-de-terrenos':      '004AG-Preparacion',
  'produccion-de-pastos':         '005AG-Produccion de Pastos',
  'alimentacion-nutricion-animal':'006AG-Alimentacion',
  'produccion-cereales-leguminosas': '007AG-Produccion de cereales',
  'produccion-de-tuberosas':      '008AG-Produccion de Tuberosas',
  'produccion-de-aves':           '009AG-Produccion de Aves',
  'produccion-de-cuyes':          '010AG-Produccion de cuyes',
  'inseminacion-artificial':      '029AG',

  // Enfermería (ENF)
  'biologia-general':             '001ENF',
  'anatomia-funcional':           '002ENF',
  'primeros-auxilios':            '003ENF',
  'terminologia-en-salud':        '004ENF',
  'educacion-para-la-salud':      '005ENF',
  'salud-publica':                '006ENF',
  'actividades-salud-comunitaria':'007ENF',
  'asistencia-en-inmunizaciones': '008ENF',
  'documentacion-en-salud':       '009ENF',
  'bioseguridad':                 '010ENF',
  'asistencia-al-usuario-oncologico': '025ENF',
  'fisioterapia-y-rehabilitacion':'028ENF',
  'salud-bucal':                  '029ENF',

  // Sin plan en Culqi o ambiguo — se omiten
  'clasificacion-de-medicamentos': null,
  'atencion-cliente-centros-veterinarios': null,
  'certificados-y-firmas-digitales': null,
  'facturacion-electronica-sunat': null,
  'mecanizacion-agricola': null,
  'planeacion-y-organizacion': null,  // aparece en ADM y BAN — elegir manualmente
  'document-controller': null,
}

// ── Encontrar CSV ──────────────────────────────────────────────────────────
function findCsv() {
  const arg = process.argv[2]
  if (arg) return resolve(process.cwd(), arg)
  const files = readdirSync(ROOT).filter(f => f.startsWith('reporte_planes') && f.endsWith('.csv'))
  if (files.length === 0) throw new Error('No se encontró ningún archivo reporte_planes*.csv en la raíz del proyecto.')
  if (files.length > 1) console.warn(`⚠️  Varios CSV encontrados, usando: ${files[0]}`)
  return resolve(ROOT, files[0])
}

// ── Parsear una línea CSV con comillas ─────────────────────────────────────
function parseCsvLine(line) {
  const cols = []
  let current = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === ',' && !inQuote) { cols.push(current); current = ''; continue }
    current += ch
  }
  cols.push(current)
  return cols
}

// ── Normalizar texto: quitar acentos + mayúsculas ──────────────────────────
function norm(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// ── Construir link de suscripción a partir del Plan ID ──────────────────────
function buildLink(planId) {
  return `https://subscriptions.culqi.com/onboarding?id=${planId}`
}

// ── Insertar o actualizar culqiLink en el texto de cursos.ts ───────────────
function setCulqiLink(content, slug, link) {
  // Si ya existe culqiLink en el bloque de este slug, actualizarlo
  const updateRe = new RegExp(
    `(slug:\\s*'${slug}'[\\s\\S]*?culqiLink:\\s*')[^']*(')`
  )
  if (updateRe.test(content)) {
    return content.replace(updateRe, `$1${link}$2`)
  }

  // Insertar después del campo price si existe
  const afterPriceRe = new RegExp(
    `(slug:\\s*'${slug}'[\\s\\S]*?price:\\s*'[^']*')(,?)(\n)`
  )
  if (afterPriceRe.test(content)) {
    return content.replace(afterPriceRe, `$1$2$3    culqiLink: '${link}',\n`)
  }

  // Fallback: insertar después del slug
  const afterSlugRe = new RegExp(`(slug:\\s*'${slug}')(,?)(\n)`)
  return content.replace(afterSlugRe, `$1$2$3    culqiLink: '${link}',\n`)
}

// ── MAIN ───────────────────────────────────────────────────────────────────
const csvPath = findCsv()
console.log(`\n📄  Leyendo: ${basename(csvPath)}\n`)

const lines = readFileSync(csvPath, 'utf-8').split('\n').filter(l => l.trim())
const headers = parseCsvLine(lines[0])
const nameIdx  = headers.findIndex(h => h.includes('Nombre'))
const planIdx  = headers.findIndex(h => h.includes('Plan ID'))

if (nameIdx < 0 || planIdx < 0) {
  console.error('❌  No se encontraron las columnas "Nombre plan" y "Plan ID" en el CSV.')
  process.exit(1)
}

// Parsear todos los planes
const plans = lines.slice(1)
  .map(l => parseCsvLine(l))
  .map(cols => ({ name: cols[nameIdx]?.trim() ?? '', planId: cols[planIdx]?.trim() ?? '' }))
  .filter(p => p.planId.startsWith('pln_'))

console.log(`✅  ${plans.length} planes cargados del CSV\n`)

// Construir mapeo slug → link
const updates = {}
const skipped = []
const noMatch = []

for (const [slug, fragment] of Object.entries(SLUG_TO_PLAN_FRAGMENT)) {
  if (fragment === null) {
    skipped.push(slug)
    continue
  }
  const normFrag = norm(fragment)
  const plan = plans.find(p => norm(p.name).includes(normFrag))
  if (plan) {
    updates[slug] = buildLink(plan.planId)
    console.log(`   ✅  ${slug.padEnd(40)} ← ${plan.name}`)
  } else {
    noMatch.push({ slug, fragment })
    console.log(`   ⚠️  ${slug.padEnd(40)} ← sin match para "${fragment}"`)
  }
}

const totalMatched = Object.keys(updates).length

if (totalMatched === 0) {
  console.log('\n❌  No se encontró ningún match. Verifica el CSV.\n')
  process.exit(1)
}

console.log(`\n📊  ${totalMatched} cursos con match, ${skipped.length} sin plan asignado, ${noMatch.length} sin match`)

// Aplicar cambios en cursos.ts
const cursosPath = resolve(ROOT, 'src/data/programs/cursos.ts')
let content = readFileSync(cursosPath, 'utf-8')

for (const [slug, link] of Object.entries(updates)) {
  content = setCulqiLink(content, slug, link)
}

writeFileSync(cursosPath, content, 'utf-8')

console.log(`\n✅  cursos.ts actualizado con ${totalMatched} links de suscripción.`)

if (skipped.length > 0) {
  console.log(`\n⏭️  Omitidos (sin plan o ambiguos):`)
  for (const s of skipped) console.log(`   - ${s}`)
}

console.log(`
⚠️  Antes de hacer commit, verifica que un link funcione:
   Abre en el navegador: ${buildLink('pln_live_BwQXGhWimQMNUHmb')}
   (biologia-agropecuaria — si abre la página de pago de Culqi, el formato es correcto)
`)
