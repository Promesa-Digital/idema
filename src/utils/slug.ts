/**
 * Deriva el slug de un nombre, para que nadie tenga que inventarlo a mano.
 * Quita tildes y la eñe porque romperían la URL, colapsa todo lo demás en guiones.
 */
export function generarSlug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // "Diseño Gráfico" -> "Diseno Grafico"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
