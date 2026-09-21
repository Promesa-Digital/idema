import { FiPlus, FiTrash2 } from 'react-icons/fi'

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100'

interface EtiquetaProps {
  label: string
  hint?: string
  required?: boolean
}

function Encabezado({ label, hint, required }: EtiquetaProps) {
  return (
    <>
      <span className="mb-1.5 block text-sm font-semibold text-dark">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
    </>
  )
}

function BotonAgregar({ texto, onClick, disabled }: { texto: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FiPlus aria-hidden /> {texto}
    </button>
  )
}

function BotonQuitar({ onClick, disabled, etiqueta }: { onClick: () => void; disabled?: boolean; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FiTrash2 aria-hidden />
    </button>
  )
}

interface ListEditorProps {
  label: string
  hint?: string
  placeholder?: string
  textoAgregar?: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
}

/** Lista de textos simples: una fila por elemento, sin que nadie escriba separadores. */
export function ListEditor({
  label,
  hint,
  placeholder,
  textoAgregar = 'Añadir',
  value,
  onChange,
  disabled,
  className = '',
}: ListEditorProps) {
  const actualizar = (indice: number, texto: string) => {
    onChange(value.map((item, i) => (i === indice ? texto : item)))
  }

  return (
    <div className={className}>
      <Encabezado label={label} hint={hint} />
      {value.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          Todavía no hay elementos.
        </p>
      )}
      <ul className="space-y-2">
        {value.map((item, indice) => (
          <li key={indice} className="flex items-center gap-2">
            <span className="w-6 flex-shrink-0 text-right text-xs font-semibold text-slate-400">
              {indice + 1}
            </span>
            <input
              type="text"
              value={item}
              onChange={(event) => actualizar(indice, event.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={INPUT_CLASS}
            />
            <BotonQuitar
              onClick={() => onChange(value.filter((_, i) => i !== indice))}
              disabled={disabled}
              etiqueta={`Quitar elemento ${indice + 1}`}
            />
          </li>
        ))}
      </ul>
      <BotonAgregar texto={textoAgregar} onClick={() => onChange([...value, ''])} disabled={disabled} />
    </div>
  )
}

export interface ParDeCampos {
  primero: string
  segundo: string
}

interface PairListEditorProps {
  label: string
  hint?: string
  etiquetaPrimero: string
  etiquetaSegundo: string
  placeholderPrimero?: string
  placeholderSegundo?: string
  textoAgregar?: string
  value: ParDeCampos[]
  onChange: (value: ParDeCampos[]) => void
  disabled?: boolean
  className?: string
}

/**
 * Lista de pares. Reemplaza los campos donde antes había que escribir el separador
 * `|` a mano, que era la causa real de que un dato se guardara mal sin avisar.
 */
export function PairListEditor({
  label,
  hint,
  etiquetaPrimero,
  etiquetaSegundo,
  placeholderPrimero,
  placeholderSegundo,
  textoAgregar = 'Añadir',
  value,
  onChange,
  disabled,
  className = '',
}: PairListEditorProps) {
  const actualizar = (indice: number, campo: keyof ParDeCampos, texto: string) => {
    onChange(value.map((item, i) => (i === indice ? { ...item, [campo]: texto } : item)))
  }

  return (
    <div className={className}>
      <Encabezado label={label} hint={hint} />
      {value.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          Todavía no hay elementos.
        </p>
      )}
      <ul className="space-y-3">
        {value.map((item, indice) => (
          <li key={indice} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <span className="mt-2.5 w-6 flex-shrink-0 text-right text-xs font-semibold text-slate-400">
              {indice + 1}
            </span>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">{etiquetaPrimero}</span>
                <input
                  type="text"
                  value={item.primero}
                  onChange={(event) => actualizar(indice, 'primero', event.target.value)}
                  placeholder={placeholderPrimero}
                  disabled={disabled}
                  className={INPUT_CLASS}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">{etiquetaSegundo}</span>
                <input
                  type="text"
                  value={item.segundo}
                  onChange={(event) => actualizar(indice, 'segundo', event.target.value)}
                  placeholder={placeholderSegundo}
                  disabled={disabled}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <BotonQuitar
              onClick={() => onChange(value.filter((_, i) => i !== indice))}
              disabled={disabled}
              etiqueta={`Quitar fila ${indice + 1}`}
            />
          </li>
        ))}
      </ul>
      <BotonAgregar
        texto={textoAgregar}
        onClick={() => onChange([...value, { primero: '', segundo: '' }])}
        disabled={disabled}
      />
    </div>
  )
}
