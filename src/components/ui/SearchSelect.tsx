import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi'

export interface SearchSelectOption {
  value: string
  /** Texto principal: lo que el usuario recuerda y teclea. */
  label: string
  /** Dato secundario que ayuda a desempatar, por ejemplo el código. */
  hint?: string
  /** Si se indica, las opciones se muestran agrupadas bajo este rótulo. */
  group?: string
}

export interface SearchSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  /** Qué decir cuando no hay ninguna opción que ofrecer. */
  emptyMessage?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  containerClassName?: string
  /** Texto del botón que vacía la selección. Si se omite, no se puede vaciar. */
  clearLabel?: string
}

/** "Diseño Gráfico" -> "diseno grafico", para que la tilde no impida encontrarlo. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export default function SearchSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Busca y selecciona…',
  emptyMessage = 'No hay opciones disponibles.',
  error,
  hint,
  required,
  disabled,
  containerClassName = '',
  clearLabel,
}: SearchSelectProps) {
  const [abierto, setAbierto] = useState(false)
  const [consulta, setConsulta] = useState('')
  const [resaltada, setResaltada] = useState(0)
  const [haciaArriba, setHaciaArriba] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const baseId = useId()
  const listaId = `${baseId}-lista`
  const descripcionId = error || hint ? `${baseId}-descripcion` : undefined

  const seleccionada = useMemo(
    () => options.find((opcion) => opcion.value === value),
    [options, value],
  )

  const filtradas = useMemo(() => {
    const termino = normalizar(consulta).trim()
    if (!termino) return options

    // Cada palabra por separado: "enf tec" debe encontrar "Enfermería Técnica".
    const palabras = termino.split(/\s+/)
    return options.filter((opcion) => {
      const texto = normalizar(`${opcion.label} ${opcion.hint ?? ''} ${opcion.group ?? ''}`)
      return palabras.every((palabra) => texto.includes(palabra))
    })
  }, [consulta, options])

  /** Las opciones en el mismo orden en que se pintan, para que las flechas coincidan. */
  const agrupadas = useMemo(() => {
    if (!filtradas.some((opcion) => opcion.group)) {
      return [{ group: undefined as string | undefined, opciones: filtradas }]
    }
    const grupos = new Map<string, SearchSelectOption[]>()
    for (const opcion of filtradas) {
      const clave = opcion.group ?? 'Otros'
      const actual = grupos.get(clave)
      if (actual) actual.push(opcion)
      else grupos.set(clave, [opcion])
    }
    return [...grupos.entries()].map(([group, opciones]) => ({ group, opciones }))
  }, [filtradas])

  const planas = useMemo(() => agrupadas.flatMap((g) => g.opciones), [agrupadas])

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) {
        setAbierto(false)
        setConsulta('')
      }
    }
    document.addEventListener('mousedown', alPulsarFuera)
    return () => document.removeEventListener('mousedown', alPulsarFuera)
  }, [abierto])

  // Mantiene visible la opción resaltada mientras se navega con el teclado.
  useEffect(() => {
    if (!abierto) return
    lista.current
      ?.querySelector(`[data-indice="${resaltada}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [abierto, resaltada])

  const abrir = () => {
    if (disabled) return
    // Dentro de un modal con scroll propio, un campo al final del formulario abriría la
    // lista fuera de la vista. Si abajo no cabe y arriba sí, se despliega hacia arriba.
    const caja = contenedor.current?.getBoundingClientRect()
    if (caja) {
      const alto = 280
      setHaciaArriba(window.innerHeight - caja.bottom < alto && caja.top > alto)
    }
    setAbierto(true)
    setConsulta('')
    setResaltada(0)
  }

  const elegir = (opcion: SearchSelectOption) => {
    onChange(opcion.value)
    setAbierto(false)
    setConsulta('')
    campo.current?.focus()
  }

  const alTeclear = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!abierto) {
        abrir()
        return
      }
      if (planas.length === 0) return
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setResaltada((actual) => (actual + paso + planas.length) % planas.length)
      return
    }

    if (evento.key === 'Enter') {
      if (!abierto) return
      // Dentro de un formulario, Enter sobre el buscador elige opción; no envía.
      evento.preventDefault()
      const opcion = planas[resaltada]
      if (opcion) elegir(opcion)
      return
    }

    if (evento.key === 'Escape') {
      if (!abierto) return
      evento.preventDefault()
      evento.stopPropagation() // que no cierre además el modal que lo contiene
      setAbierto(false)
      setConsulta('')
      return
    }

    if (evento.key === 'Tab' && abierto) {
      setAbierto(false)
      setConsulta('')
    }
  }

  const bordeEstado = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : 'border-slate-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={baseId} className="mb-1.5 block text-sm font-semibold text-dark">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}

      <div ref={contenedor} className="relative">
        <div
          className={`flex min-h-11 items-center gap-2 rounded-lg border bg-white px-3 transition ${bordeEstado} ${
            disabled ? 'cursor-not-allowed bg-slate-100' : ''
          }`}
        >
          <FiSearch aria-hidden="true" className="shrink-0 text-slate-400" />
          <input
            ref={campo}
            id={baseId}
            role="combobox"
            type="text"
            autoComplete="off"
            aria-expanded={abierto}
            aria-controls={abierto ? listaId : undefined}
            aria-activedescendant={
              abierto && planas[resaltada] ? `${baseId}-opcion-${resaltada}` : undefined
            }
            aria-invalid={error ? true : undefined}
            aria-describedby={descripcionId}
            aria-required={required}
            disabled={disabled}
            // Cerrado muestra lo elegido; abierto, lo que se está tecleando.
            value={abierto ? consulta : (seleccionada?.label ?? '')}
            placeholder={seleccionada ? seleccionada.label : placeholder}
            onChange={(evento) => {
              if (!abierto) setAbierto(true)
              setConsulta(evento.target.value)
              // Al filtrar cambia la lista bajo los pies: la marca vuelve arriba en vez
              // de seguir apuntando a una posición que ya es otra opción distinta.
              setResaltada(0)
            }}
            // Abre al pulsar, al escribir o con las flechas, pero NO al recibir el foco:
            // devolver el foco tras elegir volvía a desplegar la lista recién cerrada,
            // y además tabular por el formulario no debería abrir nada.
            onClick={abrir}
            onKeyDown={alTeclear}
            className="min-w-0 flex-1 bg-transparent py-2 text-dark outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
          />

          {clearLabel && value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setConsulta('')
                campo.current?.focus()
              }}
              aria-label={clearLabel}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-dark"
            >
              <FiX aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            onClick={() => (abierto ? setAbierto(false) : campo.current?.focus())}
            className="shrink-0 text-slate-400 disabled:cursor-not-allowed"
          >
            <FiChevronDown className={`transition ${abierto ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {abierto && (
          <div
            className={`absolute left-0 right-0 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ${
              haciaArriba ? 'bottom-full mb-1' : 'mt-1'
            }`}
          >
            <ul ref={lista} id={listaId} role="listbox" className="max-h-64 overflow-y-auto py-1">
              {planas.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  {options.length === 0 ? emptyMessage : `Nada coincide con “${consulta}”.`}
                </li>
              ) : (
                agrupadas.map((grupo) => (
                  <li key={grupo.group ?? '_'}>
                    {grupo.group && (
                      <p className="px-3 pb-1 pt-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {grupo.group}
                      </p>
                    )}
                    <ul>
                      {grupo.opciones.map((opcion) => {
                        const indice = planas.indexOf(opcion)
                        const activa = indice === resaltada
                        const elegida = opcion.value === value
                        return (
                          <li key={opcion.value}>
                            <button
                              type="button"
                              id={`${baseId}-opcion-${indice}`}
                              data-indice={indice}
                              role="option"
                              aria-selected={elegida}
                              onMouseEnter={() => setResaltada(indice)}
                              onClick={() => elegir(opcion)}
                              className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition ${
                                activa ? 'bg-primary/10' : ''
                              } ${elegida ? 'font-bold text-primary' : 'text-slate-700'}`}
                            >
                              <span className="min-w-0 flex-1 truncate">{opcion.label}</span>
                              {opcion.hint && (
                                <span className="shrink-0 text-xs text-slate-400">{opcion.hint}</span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            {options.length > 8 && (
              <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                {planas.length === options.length
                  ? `${options.length} opciones. Escribe para filtrar.`
                  : `${planas.length} de ${options.length}`}
              </p>
            )}
          </div>
        )}
      </div>

      {(error || hint) && (
        <p
          id={descripcionId}
          role={error ? 'alert' : undefined}
          className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
