/**
 * Genera el contenido de un CSV escapando según RFC 4180: las comillas se duplican y
 * todo campo que contenga separador, comillas o saltos de línea se encierra entre
 * comillas. Sin esto, un nombre con una coma parte la fila y el archivo queda corrido.
 */
export function construirCSV(encabezados: string[], filas: Array<Array<string | number | null>>): string {
  const escapar = (valor: string | number | null): string => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }

  return [encabezados, ...filas]
    .map((fila) => fila.map(escapar).join(';'))
    .join('\r\n')
}

/**
 * Descarga el CSV en el navegador.
 *
 * Se usa punto y coma como separador y se antepone un BOM porque el destino real de
 * estos archivos es Excel en español: con coma interpreta todo en una sola columna, y
 * sin BOM muestra "EnfermerÃ­a" en lugar de "Enfermería".
 */
export function descargarCSV(
  nombreArchivo: string,
  encabezados: string[],
  filas: Array<Array<string | number | null>>,
): void {
  const contenido = '﻿' + construirCSV(encabezados, filas)
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}
