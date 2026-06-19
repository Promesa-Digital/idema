/**
 * sync-culqi-links.mjs
 *
 * Consulta la API de Culqi para obtener todos los planes de suscripción,
 * los muestra en pantalla y actualiza automáticamente el campo `culqiLink`
 * en src/data/programs/cursos.ts.
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
  console.error('   Agrega: CULQI_SECRET_KEY=sk_live_xxxx\n')
  process.exit(1)
}

// ── Llamar API de Culqi ────────────────────────────────────────────────────
async function culqiGet(path, base = 'https://api.culqi.com/v2') {
  const url = `${base}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  const body = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} @ ${url}\n   ${body}`)
  }
  return JSON.parse(body)
}

// ── Construir el link usando el campo "slug" (uuidV4) del plan ─────────────
// Culqi lo llama "slug" en la doc pero puede venir con otro nombre
function buildLink(plan) {
  const uuid = plan.slug ?? plan.uuid ?? plan.plan_uuid ?? plan.link_id ?? null
  if (!uuid || uuid === 'undefined') return null
  return `https://subscriptions.culqi.com/onboarding?id=${uuid}`
}

// ── Normalizar texto para comparación fuzzy ────────────────────────────────
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Score de similitud simple (palabras en común) ──────────────────────────
function similarity(a, b) {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 3))
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 3))
  let matches = 0
  for (const w of wordsA) if (wordsB.has(w)) matches++
  return matches / Math.max(wordsA.size, wordsB.size, 1)
}

// ── Leer slugs y títulos de cursos.ts ─────────────────────────────────────
function parseCourses(fileContent) {
  const courses = []
  const slugRe = /slug:\s*'([^']+)'/g
  const titleRe = /title:\s*'([^']+)'/g
  let slugMatch, titleMatch
  const slugs = [], titles = []
  while ((slugMatch = slugRe.exec(fileContent))) slugs.push(slugMatch[1])
  while ((titleMatch = titleRe.exec(fileContent))) titles.push(titleMatch[1])
  for (let i = 0; i < slugs.length; i++) {
    courses.push({ slug: slugs[i], title: titles[i] || slugs[i] })
  }
  return courses
}

// ── Insertar o actualizar culqiLink en el bloque de un curso ──────────────
function setCulqiLink(fileContent, slug, link) {
  // Si ya tiene culqiLink para este slug, actualizarlo
  const existingRe = new RegExp(
    `(slug:\\s*'${slug}'[\\s\\S]*?culqiLink:\\s*')[^']*(')`
  )
  if (existingRe.test(fileContent)) {
    return fileContent.replace(existingRe, `$1${link}$2`)
  }

  // Si no tiene culqiLink, insertar después del campo price (o del slug si no hay price)
  const insertAfterRe = new RegExp(
    `(slug:\\s*'${slug}'[\\s\\S]*?price:\\s*'[^']*')(,?)(\n)`
  )
  if (insertAfterRe.test(fileContent)) {
    return fileContent.replace(
      insertAfterRe,
      `$1$2$3    culqiLink: '${link}',\n`
    )
  }

  // Fallback: insertar después del slug
  const fallbackRe = new RegExp(`(slug:\\s*'${slug}')(,?)(\n)`)
  return fileContent.replace(
    fallbackRe,
    `$1$2$3    culqiLink: '${link}',\n`
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────
const masked = SECRET_KEY.slice(0, 10) + '...' + SECRET_KEY.slice(-4)
console.log(`\n🔑  Usando key: ${masked}`)
console.log(`   Tipo detectado: ${SECRET_KEY.startsWith('sk_live') ? 'LIVE secret ✅' : SECRET_KEY.startsWith('sk_test') ? 'TEST secret ✅' : SECRET_KEY.startsWith('pk_') ? 'PUBLIC key ⚠️  (necesitas la SECRET key)' : 'desconocido ⚠️'}`)
console.log('\n🔍  Consultando planes de suscripción en Culqi...\n')

// Endpoint correcto según la doc de Culqi: /v2/recurrent/plans
// El campo "slug" del plan es el uuidV4 que va en el link de suscripción
const from = 1000000000  // año 2001 — cubre todos los planes
const to   = 9999999999  // año 2286

let plans = []
let nextUrl = `https://api.culqi.com/v2/recurrent/plans?creation_date_from=${from}&creation_date_to=${to}&limit=100`

console.log('   Paginando planes desde /v2/recurrent/plans...')

while (nextUrl) {
  const res = await fetch(nextUrl, {
    headers: {
      Authorization:  `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  const body = await res.text()

  if (!res.ok) {
    console.error(`\n❌  Error ${res.status}: ${body.slice(0, 400)}`)
    process.exit(1)
  }

  const json = JSON.parse(body)
  const page = Array.isArray(json.data) ? json.data
             : Array.isArray(json)      ? json
             : json.data ? [json.data]  : []

  plans.push(...page)

  const remaining = json.remaining_items ?? '?'
  const cursorAfter = json.cursors?.after ?? null
  const pagingNext  = json.paging?.next   ?? null

  console.log(`   Página: +${page.length} (total: ${plans.length}, restantes: ${remaining}, cursor: ${cursorAfter ?? 'null'})`)

  // Mostrar campos del primer plan de la primera página para debug
  if (plans.length === page.length && page.length > 0) {
    console.log('\n   Campos del objeto plan:', Object.keys(page[0]).join(', '))
    console.log('   Primer plan:', JSON.stringify(page[0], null, 2).slice(0, 600))
  }

  // Usar paging.next si existe, si no construir con cursor
  if (pagingNext) {
    nextUrl = pagingNext
  } else if (cursorAfter) {
    nextUrl = `https://api.culqi.com/v2/recurrent/plans?creation_date_from=${from}&creation_date_to=${to}&limit=100&after=${cursorAfter}`
  } else {
    nextUrl = null
  }

  if (plans.length >= 500) break
}

console.log(`\n✅  ${plans.length} planes cargados desde la API.`)

if (plans.length === 0) {
  console.log('⚠️  No se encontraron planes en la cuenta de Culqi.')
  console.log('   Crea los planes de suscripción en el dashboard primero.\n')
  process.exit(0)
}

console.log(`✅  ${plans.length} plan(es) encontrado(s) en Culqi:\n`)
console.log('   ID                                    │ Nombre')
console.log('   ' + '─'.repeat(70))
for (const p of plans) {
  console.log(`   ${String(p.id).padEnd(38)} │ ${p.name ?? p.short_name ?? '–'}`)
}

// Leer cursos.ts
const cursosPath = resolve(ROOT, 'src/data/programs/cursos.ts')
let cursosContent = readFileSync(cursosPath, 'utf-8')
const courses = parseCourses(cursosContent)

console.log(`\n🔗  Intentando emparejar con ${courses.length} cursos en cursos.ts...\n`)

const THRESHOLD = 0.4
const matched = []
const unmatched = []

for (const plan of plans) {
  const planName = plan.name ?? plan.short_name ?? ''
  let best = null
  let bestScore = 0

  for (const course of courses) {
    const score = Math.max(
      similarity(planName, course.title),
      similarity(planName, course.slug.replace(/-/g, ' '))
    )
    if (score > bestScore) {
      bestScore = score
      best = course
    }
  }

  const link = buildLink(plan)
  if (best && bestScore >= THRESHOLD) {
    matched.push({ plan: planName, course: best, link, score: bestScore })
  } else {
    unmatched.push({ plan: planName, id: plan.id, link: link ?? '(sin uuid)' })
  }
}

if (matched.length > 0) {
  console.log('✅  Emparejados automáticamente:')
  for (const m of matched) {
    const pct = Math.round(m.score * 100)
    console.log(`   [${pct}%] "${m.plan}"  →  ${m.course.slug}`)
  }
}

if (unmatched.length > 0) {
  console.log('\n⚠️  Sin emparejar (slug incorrecto o nombre muy diferente):')
  for (const u of unmatched) {
    console.log(`   "${u.plan}"  (id: ${u.id})`)
    console.log(`       link: ${u.link}`)
  }
  console.log('\n   Para asignarlos manualmente, agrega la línea en cursos.ts:')
  console.log("   culqiLink: 'https://subscriptions.culqi.com/onboarding?id=...',")
}

if (matched.length === 0) {
  console.log('\n❌  No se pudo emparejar ningún plan. Revisa los nombres en el dashboard de Culqi.')
  process.exit(0)
}

// Aplicar cambios — solo si el link tiene UUID válido
const validMatches = matched.filter(m => m.link)
for (const m of validMatches) {
  cursosContent = setCulqiLink(cursosContent, m.course.slug, m.link)
}

writeFileSync(cursosPath, cursosContent, 'utf-8')

console.log(`\n✅  cursos.ts actualizado con ${matched.length} link(s).\n`)
