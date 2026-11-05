import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

const sourceRoot = new URL('../src/', import.meta.url)
const publicRoot = new URL('../public/', import.meta.url)
const extensions = new Set(['.css', '.ts', '.tsx'])
const missing = new Map()

function collectFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    return statSync(path).isDirectory() ? collectFiles(path) : [path]
  })
}

for (const file of collectFiles(sourceRoot.pathname)) {
  if (!extensions.has(extname(file))) continue

  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('//')) return

    for (const match of line.matchAll(/["'`](\/assets\/[^"'`)}\s]+)/g)) {
      const asset = decodeURI(match[1])
      const target = join(publicRoot.pathname, asset.replace(/^\//, ''))
      if (!existsSync(target)) {
        const references = missing.get(asset) ?? []
        references.push(`${file.replace(sourceRoot.pathname, 'src/')}:${index + 1}`)
        missing.set(asset, references)
      }
    }
  })
}

if (missing.size > 0) {
  console.error('Se encontraron recursos públicos inexistentes:')
  for (const [asset, references] of missing) {
    console.error(`- ${asset}: ${references.join(', ')}`)
  }
  process.exitCode = 1
} else {
  console.log('Todos los recursos públicos referenciados existen.')
}
