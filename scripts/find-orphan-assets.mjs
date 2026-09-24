/**
 * Lista los assets de public/ que nadie referencia desde el codigo.
 *
 * NO borra nada. Un asset sin referencias en el codigo puede seguir usandose: las
 * imagenes de programas y popups viven en la base de datos (`imagen_url`), no en los
 * fuentes. Este script senala candidatos; decidir cuales sobran exige mirar tambien la
 * base del entorno correspondiente.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const raiz = new URL('../', import.meta.url).pathname
const publico = join(raiz, 'public', 'assets')
// Tambien public/: un CSS, un SVG o un HTML suelto ahi dentro puede referenciar
// imagenes, y mirar solo src/ daria por huerfano algo que si se usa.
const fuentes = [join(raiz, 'src'), join(raiz, 'index.html'), join(raiz, 'public')]
const extensionesTexto = new Set(['.css', '.ts', '.tsx', '.html', '.json', '.svg', '.js', '.php', '.xml', '.txt'])

function listar(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name)
    return e.isDirectory() ? listar(p) : [p]
  })
}

// Todo el texto del proyecto, concatenado: buscar por nombre de fichero es suficiente y
// tolera rutas construidas con plantillas.
let texto = ''
for (const origen of fuentes) {
  const archivos = statSync(origen).isDirectory() ? listar(origen) : [origen]
  for (const f of archivos) {
    if (statSync(origen).isDirectory() && !extensionesTexto.has(extname(f))) continue
    try {
      texto += readFileSync(f, 'utf8') + '\n'
    } catch {
      // Binario disfrazado de texto: no aporta referencias.
    }
  }
}

const huerfanos = []
for (const archivo of listar(publico)) {
  const nombre = archivo.split('/').pop()
  if (!texto.includes(nombre)) {
    huerfanos.push({ ruta: relative(raiz, archivo), bytes: statSync(archivo).size })
  }
}

huerfanos.sort((a, b) => b.bytes - a.bytes)
const total = huerfanos.reduce((s, h) => s + h.bytes, 0)

console.log(`${huerfanos.length} assets sin referencia en el codigo (${(total / 1048576).toFixed(1)} MB)\n`)
for (const h of huerfanos.slice(0, 25)) {
  console.log(`  ${(h.bytes / 1048576).toFixed(2).padStart(7)} MB  ${h.ruta}`)
}
if (huerfanos.length > 25) console.log(`  ... y ${huerfanos.length - 25} mas`)
console.log('\nOJO: las imagenes de programas y popups se referencian desde la base de')
console.log('datos, no desde el codigo. Contrastar antes de borrar nada.')
