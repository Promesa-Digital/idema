import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import Textarea from '@/components/ui/Textarea'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { ListEditor, PairListEditor } from '@/components/admin/ListEditor'
import { generarSlug } from '@/utils/slug'
import { descargarCSV } from '@/utils/csv'
import { siguienteCodigo } from '@/utils/codigoPrograma'
import RowActions from '@/components/ui/RowActions'
import { FiArchive, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi'
import type { ParDeCampos } from '@/components/admin/ListEditor'
import { useAuth } from '@/context/AuthContextType'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import {
  actualizarPrograma,
  archivarPrograma,
  crearPrograma,
  listarProgramas,
} from '@/services/programasApi'
import type {
  ProgramaBackend,
  ProgramaCreate,
  ProgramaEstado,
  ProgramaTipo,
  ProgramaUpdate,
} from '@/types/backend'

interface ProgramaFormState {
  codigo: string
  abreviatura: string
  nombre: string
  slug: string
  nombre_corto: string
  tipo: ProgramaTipo
  categoria: string
  malla: string
  descripcion: string
  subtitulo: string
  duracion: string
  modalidad: string
  imagen_url: string
  dirigido_a: string
  contenidos: string[]
  campo_laboral: ParDeCampos[]
  malla_curricular: ParDeCampos[]
  requisitos: string[]
  certificaciones: string[]
  mensaje_whatsapp: string
  titulacion: string
  malla_imagen_url: string
  convenio_nombre: string
  convenio_logo_url: string
  seo_titulo: string
  seo_descripcion: string
  anio: string
  num_lecciones: string
  certificado: boolean
  tutor: string
  estado: ProgramaEstado
  publicacion_programada: string
}

/** Fecha corta y legible: en una tabla, la hora exacta es ruido. */
const formatoFecha = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

const TIPO_LABELS: Record<ProgramaTipo, string> = {
  carrera: 'Carrera',
  auxiliar: 'Auxiliar',
  especializacion: 'Especialización',
  curso: 'Curso',
}

const ESTADO_LABELS: Record<ProgramaEstado, string> = {
  no_publicado: 'No publicado',
  publicado: 'Publicado',
  archivado: 'Archivado',
}

const TYPE_DEFAULTS: Record<ProgramaTipo, { duracion: string; modalidad: string }> = {
  carrera: { duracion: '3 años (6 semestres)', modalidad: 'Presencial, Semipresencial y Virtual' },
  auxiliar: { duracion: '10 meses', modalidad: '100% Virtual' },
  especializacion: { duracion: '10 meses', modalidad: '100% Virtual' },
  curso: { duracion: '4 semanas', modalidad: '100% Virtual' },
}

const EMPTY_FORM: ProgramaFormState = {
  codigo: '',
  abreviatura: '',
  nombre: '',
  slug: '',
  nombre_corto: '',
  tipo: 'carrera',
  categoria: '',
  malla: '',
  descripcion: '',
  subtitulo: '',
  duracion: TYPE_DEFAULTS.carrera.duracion,
  modalidad: TYPE_DEFAULTS.carrera.modalidad,
  imagen_url: '',
  dirigido_a: '',
  contenidos: [],
  campo_laboral: [],
  malla_curricular: [],
  requisitos: [],
  certificaciones: ['Certificado de aprobación o participación', 'Certificación Internacional ISO 21001'],
  mensaje_whatsapp: '',
  titulacion: '',
  malla_imagen_url: '',
  convenio_nombre: '',
  convenio_logo_url: '',
  seo_titulo: '',
  seo_descripcion: '',
  anio: String(new Date().getFullYear()),
  num_lecciones: '0',
  certificado: true,
  tutor: '',
  estado: 'no_publicado',
  publicacion_programada: '',
}

function toLocalDateTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toFormState(programa: ProgramaBackend): ProgramaFormState {
  return {
    codigo: programa.codigo,
    abreviatura: programa.abreviatura,
    nombre: programa.nombre,
    slug: programa.slug,
    nombre_corto: programa.nombre_corto ?? '',
    tipo: programa.tipo,
    categoria: programa.categoria,
    malla: programa.malla,
    descripcion: programa.descripcion ?? '',
    subtitulo: programa.subtitulo ?? '',
    duracion: programa.duracion ?? '',
    modalidad: programa.modalidad ?? '',
    imagen_url: programa.imagen_url ?? '',
    dirigido_a: programa.dirigido_a ?? '',
    contenidos: [...programa.contenidos],
    campo_laboral: programa.campo_laboral.map((item) => ({
      primero: item.title,
      segundo: item.description,
    })),
    malla_curricular: programa.malla_curricular.map((item) => ({
      primero: item.year,
      segundo: item.courses.join('; '),
    })),
    requisitos: [...programa.requisitos],
    certificaciones: [...programa.certificaciones],
    mensaje_whatsapp: programa.mensaje_whatsapp ?? '',
    titulacion: programa.titulacion ?? '',
    malla_imagen_url: programa.malla_imagen_url ?? '',
    convenio_nombre: programa.convenio_nombre ?? '',
    convenio_logo_url: programa.convenio_logo_url ?? '',
    seo_titulo: programa.seo_titulo ?? '',
    seo_descripcion: programa.seo_descripcion ?? '',
    anio: String(programa.anio),
    num_lecciones: String(programa.num_lecciones),
    certificado: programa.certificado,
    tutor: programa.tutor ?? '',
    estado: programa.estado,
    publicacion_programada: toLocalDateTime(programa.publicacion_programada),
  }
}

type SeccionFormulario = 'basicos' | 'ficha' | 'publicacion'

const SECCIONES: Array<{ id: SeccionFormulario; titulo: string; descripcion: string }> = [
  { id: 'basicos', titulo: 'Datos del programa', descripcion: 'Lo mínimo para poder guardarlo.' },
  { id: 'ficha', titulo: 'Ficha pública', descripcion: 'Lo que verá quien visite la página. Puedes completarlo después.' },
  { id: 'publicacion', titulo: 'Publicación y SEO', descripcion: 'Cuándo se publica y cómo aparece en buscadores.' },
]

/** Campos obligatorios, con la sección donde vive cada uno. */
const CAMPOS_OBLIGATORIOS: Array<{ campo: keyof ProgramaFormState; etiqueta: string; seccion: SeccionFormulario }> = [
  { campo: 'codigo', etiqueta: 'Código', seccion: 'basicos' },
  { campo: 'abreviatura', etiqueta: 'Abreviatura', seccion: 'basicos' },
  { campo: 'nombre', etiqueta: 'Nombre', seccion: 'basicos' },
  { campo: 'categoria', etiqueta: 'Categoría', seccion: 'basicos' },
  { campo: 'malla', etiqueta: 'Malla curricular', seccion: 'basicos' },
  { campo: 'anio', etiqueta: 'Año', seccion: 'basicos' },
  { campo: 'num_lecciones', etiqueta: 'Número de lecciones', seccion: 'basicos' },
]

/** Descarta las filas que el usuario dejó vacías al añadirlas y no llegó a llenar. */
function limpiarLista(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean)
}

function applyTypeDefaults(current: ProgramaFormState, tipo: ProgramaTipo): ProgramaFormState {
  const previousDefaults = TYPE_DEFAULTS[current.tipo]
  const nextDefaults = TYPE_DEFAULTS[tipo]
  return {
    ...current,
    tipo,
    duracion: !current.duracion || current.duracion === previousDefaults.duracion
      ? nextDefaults.duracion
      : current.duracion,
    modalidad: !current.modalidad || current.modalidad === previousDefaults.modalidad
      ? nextDefaults.modalidad
      : current.modalidad,
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function StatusBadge({ estado }: { estado: ProgramaEstado }) {
  const classes: Record<ProgramaEstado, string> = {
    publicado: 'bg-emerald-100 text-emerald-800',
    no_publicado: 'bg-amber-100 text-amber-800',
    archivado: 'bg-slate-200 text-slate-700',
  }

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${classes[estado]}`}>
      {ESTADO_LABELS[estado]}
    </span>
  )
}

export default function ProgramasAdminPage() {
  const { user, logout } = useAuth()
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<ProgramaEstado | 'todos'>('todos')
  const [tipoFilter, setTipoFilter] = useState<ProgramaTipo | 'todos'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [editingPrograma, setEditingPrograma] = useState<ProgramaBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ProgramaFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { addToast } = useToast()
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [aplicandoLote, setAplicandoLote] = useState(false)
  // Foto del formulario al abrirlo, para saber si de verdad cambió algo.
  const formInicial = useRef<ProgramaFormState>(EMPTY_FORM)
  const [seccionActiva, setSeccionActiva] = useState<SeccionFormulario>('basicos')
  // El slug se deriva del nombre salvo que alguien lo edite a mano, y entonces se respeta.
  const [slugManual, setSlugManual] = useState(false)
  // Igual con el código: se sugiere el siguiente de la secuencia, con escape manual.
  const [codigoManual, setCodigoManual] = useState(false)
  const [programaToArchive, setProgramaToArchive] = useState<ProgramaBackend | null>(null)
  const [archiveError, setArchiveError] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)
  const canManage = user?.rol === 'academico' || user?.rol === 'admin_sistema'

  const fetchProgramas = useCallback(async () => {
    try {
      const data = await listarProgramas()
      setProgramas(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setLoadError(getErrorMessage(error, 'No se pudo cargar la lista de programas.'))
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    let isActive = true

    listarProgramas()
      .then((data) => {
        if (isActive) setProgramas(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudo cargar la lista de programas.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout])

  const filteredProgramas = useMemo(() => {
    // Se comparan sin tildes para que buscar "enfermeria" encuentre "Enfermería".
    const termino = generarSlug(busqueda)
    return programas.filter((programa) => {
      const coincideBusqueda =
        !termino ||
        generarSlug(programa.nombre).includes(termino) ||
        generarSlug(programa.codigo).includes(termino) ||
        generarSlug(programa.categoria).includes(termino)
      return (
        coincideBusqueda &&
        (estadoFilter === 'todos' || programa.estado === estadoFilter) &&
        (tipoFilter === 'todos' || programa.tipo === tipoFilter)
      )
    })
  }, [busqueda, estadoFilter, programas, tipoFilter])

  /** Conteos sobre el total, no sobre lo filtrado: son el panorama, no el resultado. */
  const resumen = useMemo(() => {
    const porTipo = (tipo: ProgramaTipo) => programas.filter((p) => p.tipo === tipo).length
    return {
      total: programas.length,
      carrera: porTipo('carrera'),
      auxiliar: porTipo('auxiliar'),
      especializacion: porTipo('especializacion'),
      curso: porTipo('curso'),
      publicados: programas.filter((p) => p.estado === 'publicado').length,
      sinPublicar: programas.filter((p) => p.estado === 'no_publicado').length,
    }
  }, [programas])

  const hayFiltrosActivos = Boolean(busqueda) || estadoFilter !== 'todos' || tipoFilter !== 'todos'

  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setEstadoFilter('todos')
    setTipoFilter('todos')
  }, [])

  /** Exporta lo que el usuario está viendo, no toda la tabla: es lo que espera. */
  const exportar = useCallback(() => {
    descargarCSV(
      `programas-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Código', 'Nombre', 'Tipo', 'Categoría', 'Año', 'Lecciones', 'Estado', 'Modalidad', 'Duración', 'Actualizado'],
      filteredProgramas.map((p) => [
        p.codigo,
        p.nombre,
        TIPO_LABELS[p.tipo],
        p.categoria,
        p.anio,
        p.num_lecciones,
        ESTADO_LABELS[p.estado],
        p.modalidad ?? '',
        p.duracion ?? '',
        p.updated_at.slice(0, 10),
      ]),
    )
  }, [filteredProgramas])

  /**
   * Cierra el formulario, pidiendo confirmación si hay cambios.
   *
   * Sin esto, cerrar por error después de llenar treinta campos los borraba en silencio.
   * Se compara contra el estado con el que se abrió, no contra un formulario vacío: al
   * editar, "sin cambios" significa igual al original, no en blanco.
   */
  const cerrarFormulario = useCallback(() => {
    setIsFormOpen(false)
    setEditingPrograma(null)
    setFormError('')
    setConfirmandoDescarte(false)
  }, [])

  /**
   * Cierra el formulario, avisando si hay cambios.
   *
   * Sin esto, cerrar por error después de llenar treinta campos los borraba en silencio.
   * Se compara contra el estado con el que se abrió, no contra un formulario vacío: al
   * editar, "sin cambios" significa igual al original, no en blanco.
   */
  const closeFormModal = useCallback(() => {
    if (isSaving) return
    if (JSON.stringify(form) !== JSON.stringify(formInicial.current)) {
      setConfirmandoDescarte(true)
      return
    }
    cerrarFormulario()
  }, [cerrarFormulario, form, isSaving])

  /** Fija el formulario y guarda la foto con la que se abrió, para detectar cambios. */
  const establecerFormulario = useCallback((estado: ProgramaFormState) => {
    setForm(estado)
    formInicial.current = estado
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingPrograma(null)
    establecerFormulario({
      ...EMPTY_FORM,
      categoria: EMPTY_FORM.tipo,
      anio: String(new Date().getFullYear()),
      codigo: siguienteCodigo(programas.map((p) => p.codigo), EMPTY_FORM.tipo),
    })
    setFormError('')
    setSeccionActiva('basicos')
    setSlugManual(false)
    setCodigoManual(false)
    setIsFormOpen(true)
  }, [establecerFormulario, programas])

  const openEditModal = useCallback((programa: ProgramaBackend) => {
    setEditingPrograma(programa)
    establecerFormulario(toFormState(programa))
    setFormError('')
    setSeccionActiva('basicos')
    // Al editar, el slug ya existe y cambiarlo rompería la URL publicada.
    setSlugManual(true)
    setCodigoManual(true)
    setIsFormOpen(true)
  }, [establecerFormulario])

  /** Cambiar el tipo cambia el prefijo del código, mientras nadie lo haya fijado a mano. */
  const handleTipoChange = useCallback(
    (tipo: ProgramaTipo) => {
      setForm((current) => {
        const conDefaults = applyTypeDefaults(current, tipo)
        // La categoría siempre ha coincidido con el tipo en los 42 programas: se
        // rellena sola para no pedir dos veces el mismo dato. Sigue siendo editable.
        const conCategoria = { ...conDefaults, categoria: tipo }
        return codigoManual || editingPrograma
          ? conCategoria
          : { ...conCategoria, codigo: siguienteCodigo(programas.map((p) => p.codigo), tipo) }
      })
    },
    [codigoManual, editingPrograma, programas],
  )

  /** Escribir el nombre actualiza el slug, mientras nadie lo haya tocado a mano. */
  const handleNombreChange = useCallback(
    (nombre: string) => {
      setForm((current) => ({
        ...current,
        nombre,
        slug: slugManual ? current.slug : generarSlug(nombre),
      }))
    },
    [slugManual],
  )

  const openArchiveModal = useCallback((programa: ProgramaBackend) => {
    setProgramaToArchive(programa)
    setArchiveError('')
  }, [])

  const closeArchiveModal = useCallback(() => {
    if (isArchiving) return
    setProgramaToArchive(null)
    setArchiveError('')
  }, [isArchiving])

  /**
   * Publica o despublica desde la fila. Antes exigía abrir el formulario, ir a la
   * tercera pestaña, cambiar el estado y guardar: cuatro pasos para una sola decisión.
   */
  const cambiarEstado = useCallback(
    async (programa: ProgramaBackend, estado: ProgramaEstado) => {
      setLoadError('')
      try {
        const actualizado = await actualizarPrograma(programa.id, { estado })
        setProgramas((current) =>
          current.map((item) => (item.id === actualizado.id ? actualizado : item)),
        )
        addToast(
          'success',
          estado === 'publicado' ? 'Programa publicado' : 'Programa retirado',
          estado === 'publicado'
            ? `${actualizado.codigo} ya está visible en la web.`
            : `${actualizado.codigo} se retiró de la web.`,
        )
      } catch (error) {
        setLoadError(getErrorMessage(error, 'No se pudo cambiar el estado del programa.'))
      }
    },
    [addToast],
  )


  /**
   * Publica o retira varios programas de una vez. Los envía en paralelo pero informa
   * en un único aviso: veinte toasts seguidos serían peor que ninguno.
   */
  const cambiarEstadoEnLote = useCallback(
    async (estado: ProgramaEstado) => {
      const objetivo = programas.filter((p) => seleccionados.includes(p.id) && p.estado !== estado)
      if (objetivo.length === 0) return

      setAplicandoLote(true)
      const resultados = await Promise.allSettled(
        objetivo.map((p) => actualizarPrograma(p.id, { estado })),
      )
      const logrados = resultados
        .filter((r): r is PromiseFulfilledResult<ProgramaBackend> => r.status === 'fulfilled')
        .map((r) => r.value)

      if (logrados.length > 0) {
        setProgramas((current) =>
          current.map((item) => logrados.find((nuevo) => nuevo.id === item.id) ?? item),
        )
      }

      const fallidos = objetivo.length - logrados.length
      const verbo = estado === 'publicado' ? 'publicaron' : 'retiraron'
      if (fallidos === 0) {
        addToast('success', 'Listo', `Se ${verbo} ${logrados.length} programa(s).`)
      } else {
        addToast(
          'warning',
          'Terminó con errores',
          `Se ${verbo} ${logrados.length} de ${objetivo.length}. ${fallidos} no se pudo(ieron) cambiar.`,
        )
      }
      setSeleccionados([])
      setAplicandoLote(false)
    },
    [addToast, programas, seleccionados],
  )

  /**
   * Abre el formulario con los datos de otro programa ya cargados. Los cursos se
   * parecen mucho entre sí, y partir de uno existente evita rellenar treinta campos.
   */
  const duplicar = useCallback(
    (programa: ProgramaBackend) => {
      const nombre = `${programa.nombre} (copia)`
      setEditingPrograma(null)
      establecerFormulario({
        ...toFormState(programa),
        nombre,
        slug: generarSlug(nombre),
        codigo: siguienteCodigo(programas.map((p) => p.codigo), programa.tipo),
        // Una copia nunca nace publicada: hay que revisarla antes.
        estado: 'no_publicado',
        publicacion_programada: '',
      })
        setFormError('')
      setSeccionActiva('basicos')
      setSlugManual(false)
      setCodigoManual(false)
      setIsFormOpen(true)
    },
    [establecerFormulario, programas],
  )

  const columns = useMemo<TableColumn<ProgramaBackend>[]>(() => {
    const baseColumns: TableColumn<ProgramaBackend>[] = [
      {
        key: 'codigo',
        header: 'Código',
        sortValue: (programa) => programa.codigo,
        render: (programa) => <span className="font-bold text-dark">{programa.codigo}</span>,
      },
      {
        key: 'nombre',
        header: 'Programa',
        sortValue: (programa) => programa.nombre,
        render: (programa) => (
          <div className="min-w-56">
            <p className="font-semibold text-dark">{programa.nombre}</p>
            <p className="text-xs text-slate-500">{programa.abreviatura}</p>
          </div>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        sortValue: (programa) => TIPO_LABELS[programa.tipo],
        render: (programa) => TIPO_LABELS[programa.tipo],
      },
      {
        key: 'anio',
        header: 'Año',
        sortValue: (programa) => programa.anio,
        render: (programa) => programa.anio,
      },
      {
        key: 'num_lecciones',
        header: 'Lecciones',
        sortValue: (programa) => programa.num_lecciones,
        render: (programa) => programa.num_lecciones,
      },
      {
        key: 'estado',
        header: 'Estado',
        sortValue: (programa) => ESTADO_LABELS[programa.estado],
        render: (programa) => <StatusBadge estado={programa.estado} />,
      },
      {
        key: 'actualizado',
        header: 'Actualizado',
        sortValue: (programa) => programa.updated_at,
        render: (programa) => (
          <span className="whitespace-nowrap text-xs text-slate-500" title={programa.updated_at}>
            {formatoFecha.format(new Date(programa.updated_at))}
          </span>
        ),
      },
    ]

    if (canManage) {
      baseColumns.push({
        key: 'acciones',
        header: 'Acciones',
        render: (programa) => (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEditModal(programa)}>
              Editar
            </Button>
            <RowActions
              etiquetaAccesible={`Más acciones para ${programa.nombre}`}
              acciones={
                programa.estado === 'archivado'
                  ? []
                  : [
                      programa.estado === 'publicado'
                        ? {
                            etiqueta: 'Retirar de la web',
                            icono: <FiEyeOff aria-hidden />,
                            onSelect: () => void cambiarEstado(programa, 'no_publicado'),
                          }
                        : {
                            etiqueta: 'Publicar',
                            icono: <FiEye aria-hidden />,
                            onSelect: () => void cambiarEstado(programa, 'publicado'),
                          },
                      {
                        etiqueta: 'Duplicar',
                        icono: <FiCopy aria-hidden />,
                        onSelect: () => duplicar(programa),
                      },
                      {
                        etiqueta: 'Archivar',
                        destructiva: true,
                        icono: <FiArchive aria-hidden />,
                        onSelect: () => openArchiveModal(programa),
                      },
                    ]
              }
            />
          </div>
        ),
      })
    }

    return baseColumns
  }, [cambiarEstado, canManage, duplicar, openArchiveModal, openEditModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    // Se valida a mano porque los campos de otras secciones están ocultos, y el navegador
    // no sabe avisar sobre un campo que no puede mostrar.
    const faltante = CAMPOS_OBLIGATORIOS.find(({ campo }) => !String(form[campo] ?? '').trim())
    if (faltante) {
      setSeccionActiva(faltante.seccion)
      setFormError(`Falta completar "${faltante.etiqueta}".`)
      return
    }

    setIsSaving(true)

    const payload: ProgramaCreate = {
      codigo: form.codigo.trim(),
      abreviatura: form.abreviatura.trim(),
      nombre: form.nombre.trim(),
      slug: form.slug.trim() || null,
      nombre_corto: form.nombre_corto.trim() || null,
      tipo: form.tipo,
      categoria: form.categoria.trim(),
      malla: form.malla.trim(),
      descripcion: form.descripcion.trim() || null,
      subtitulo: form.subtitulo.trim() || null,
      duracion: form.duracion.trim() || null,
      modalidad: form.modalidad.trim() || null,
      imagen_url: form.imagen_url.trim() || null,
      dirigido_a: form.dirigido_a.trim() || null,
      contenidos: limpiarLista(form.contenidos),
      campo_laboral: form.campo_laboral
        .filter((item) => item.primero.trim())
        .map((item) => ({ title: item.primero.trim(), description: item.segundo.trim() })),
      malla_curricular: form.malla_curricular
        .filter((item) => item.primero.trim())
        .map((item) => ({
          year: item.primero.trim(),
          courses: item.segundo.split(';').map((curso) => curso.trim()).filter(Boolean),
        })),
      requisitos: limpiarLista(form.requisitos),
      certificaciones: limpiarLista(form.certificaciones),
      mensaje_whatsapp: form.mensaje_whatsapp.trim() || null,
      titulacion: form.titulacion.trim() || null,
      malla_imagen_url: form.malla_imagen_url.trim() || null,
      convenio_nombre: form.convenio_nombre.trim() || null,
      convenio_logo_url: form.convenio_logo_url.trim() || null,
      seo_titulo: form.seo_titulo.trim() || null,
      seo_descripcion: form.seo_descripcion.trim() || null,
      anio: Number(form.anio),
      num_lecciones: Number(form.num_lecciones),
      certificado: form.certificado,
      tutor: form.tutor.trim() || null,
      estado: form.estado,
      publicacion_programada: form.publicacion_programada
        ? new Date(form.publicacion_programada).toISOString()
        : null,
    }

    try {
      if (editingPrograma) {
        const updatePayload: ProgramaUpdate = {
          abreviatura: payload.abreviatura,
          nombre: payload.nombre,
          slug: payload.slug,
          nombre_corto: payload.nombre_corto,
          tipo: payload.tipo,
          categoria: payload.categoria,
          malla: payload.malla,
          descripcion: payload.descripcion,
          subtitulo: payload.subtitulo,
          duracion: payload.duracion,
          modalidad: payload.modalidad,
          imagen_url: payload.imagen_url,
          dirigido_a: payload.dirigido_a,
          contenidos: payload.contenidos,
          campo_laboral: payload.campo_laboral,
          malla_curricular: payload.malla_curricular,
          requisitos: payload.requisitos,
          certificaciones: payload.certificaciones,
          mensaje_whatsapp: payload.mensaje_whatsapp,
          titulacion: payload.titulacion,
          malla_imagen_url: payload.malla_imagen_url,
          convenio_nombre: payload.convenio_nombre,
          convenio_logo_url: payload.convenio_logo_url,
          seo_titulo: payload.seo_titulo,
          seo_descripcion: payload.seo_descripcion,
          anio: payload.anio,
          num_lecciones: payload.num_lecciones,
          certificado: payload.certificado,
          tutor: payload.tutor,
          estado: payload.estado,
          publicacion_programada: payload.publicacion_programada,
        }
        const updated = await actualizarPrograma(editingPrograma.id, updatePayload)
        setProgramas((current) =>
          current.map((programa) => (programa.id === updated.id ? updated : programa)),
        )
        addToast('success', 'Cambios guardados', `El programa ${updated.codigo} se actualizó.`)
      } else {
        const created = await crearPrograma(payload)
        setProgramas((current) => [created, ...current])
        addToast('success', 'Programa creado', `${created.codigo} quedó en borrador, sin publicar.`)
      }
      setIsFormOpen(false)
      setEditingPrograma(null)
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo guardar el programa.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!programaToArchive) return
    setArchiveError('')
    setIsArchiving(true)

    try {
      const archived = await archivarPrograma(programaToArchive.id)
      setProgramas((current) =>
        current.map((programa) => (programa.id === archived.id ? archived : programa)),
      )
      addToast('success', 'Programa archivado', `${archived.codigo} salió del listado activo.`)
      setProgramaToArchive(null)
    } catch (error) {
      setArchiveError(getErrorMessage(error, 'No se pudo archivar el programa.'))
    } finally {
      setIsArchiving(false)
    }
  }

  const handleRetry = () => {
    setLoadError('')
    setIsLoading(true)
    void fetchProgramas()
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isLoading && !loadError && (
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { etiqueta: 'Total', valor: resumen.total, destacado: true },
              { etiqueta: 'Carreras', valor: resumen.carrera },
              { etiqueta: 'Auxiliares', valor: resumen.auxiliar },
              { etiqueta: 'Especializaciones', valor: resumen.especializacion },
              { etiqueta: 'Cursos', valor: resumen.curso },
              { etiqueta: 'Sin publicar', valor: resumen.sinPublicar, alerta: resumen.sinPublicar > 0 },
            ].map((dato) => (
              <div
                key={dato.etiqueta}
                className={`rounded-xl border bg-white px-4 py-3 ${
                  dato.alerta ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
                }`}
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {dato.etiqueta}
                </dt>
                <dd
                  className={`mt-1 text-2xl font-bold ${
                    dato.alerta ? 'text-amber-700' : dato.destacado ? 'text-primary' : 'text-dark'
                  }`}
                >
                  {dato.valor}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Buscar"
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre, código o categoría"
              containerClassName="min-w-52"
            />
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) =>
                setEstadoFilter(event.target.value as ProgramaEstado | 'todos')
              }
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los estados</option>
              <option value="no_publicado">No publicado</option>
              <option value="publicado">Publicado</option>
              <option value="archivado">Archivado</option>
            </Select>
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => setTipoFilter(event.target.value as ProgramaTipo | 'todos')}
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los tipos</option>
              <option value="carrera">Carrera</option>
              <option value="auxiliar">Auxiliar</option>
              <option value="especializacion">Especialización</option>
              <option value="curso">Curso</option>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={exportar} disabled={filteredProgramas.length === 0}>
              Exportar CSV
            </Button>
            {canManage && (
              <Button size="lg" onClick={openCreateModal}>
                Nuevo programa
              </Button>
            )}
          </div>
        </div>


        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando programas...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
        ) : (
          <>
            {canManage && seleccionados.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <span className="text-sm font-semibold text-dark">
                  {seleccionados.length} seleccionado(s)
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void cambiarEstadoEnLote('publicado')}
                    isLoading={aplicandoLote}
                  >
                    Publicar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void cambiarEstadoEnLote('no_publicado')}
                    isLoading={aplicandoLote}
                  >
                    Retirar de la web
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setSeleccionados([])}
                  className="text-sm font-semibold text-slate-500 hover:text-dark"
                >
                  Quitar selección
                </button>
              </div>
            )}
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-600">
                {hayFiltrosActivos ? (
                  <>
                    Mostrando <strong className="text-dark">{filteredProgramas.length}</strong> de{' '}
                    {programas.length} programas
                  </>
                ) : (
                  <>{programas.length} programas</>
                )}
              </p>
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Quitar filtros
                </button>
              )}
            </div>
            <Table
              columns={columns}
              data={filteredProgramas}
              getRowKey={(programa) => programa.id}
              seleccion={
                canManage
                  ? {
                      seleccionados,
                      onChange: setSeleccionados,
                      // Un programa archivado ya salió del circuito: no se publica ni se retira.
                      puedeSeleccionarse: (programa) => programa.estado !== 'archivado',
                    }
                  : undefined
              }
              caption="Listado de programas académicos"
              emptyMessage="No hay programas que coincidan con los filtros seleccionados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingPrograma ? `Editar ${editingPrograma.codigo}` : 'Nuevo programa'}
        size="xl"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="programa-form" isLoading={isSaving}>
              {editingPrograma ? 'Guardar cambios' : 'Crear programa'}
            </Button>
          </>
        }
      >
        <form id="programa-form" onSubmit={handleSubmit} noValidate>
          <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200" role="tablist">
            {SECCIONES.map((seccion) => {
              const activa = seccion.id === seccionActiva
              const faltantes = CAMPOS_OBLIGATORIOS.filter(
                ({ campo, seccion: s }) => s === seccion.id && !String(form[campo] ?? '').trim(),
              ).length
              return (
                <button
                  key={seccion.id}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setSeccionActiva(seccion.id)}
                  disabled={isSaving}
                  className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                    activa
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-dark'
                  }`}
                >
                  {seccion.titulo}
                  {faltantes > 0 && (
                    <span
                      title={`${faltantes} campo(s) obligatorio(s) por completar`}
                      className="rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-700"
                    >
                      {faltantes}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <p className="mb-4 text-sm text-slate-500">
            {SECCIONES.find((s) => s.id === seccionActiva)?.descripcion}
          </p>

          {formError && (
            <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2" hidden={seccionActiva !== 'basicos'}>
          {editingPrograma || codigoManual ? (
            <Input
              label="Código"
              value={form.codigo}
              onChange={(event) =>
                setForm((current) => ({ ...current, codigo: event.target.value.toUpperCase() }))
              }
              maxLength={10}
              required
              disabled={Boolean(editingPrograma) || isSaving}
              hint={
                editingPrograma
                  ? 'El código no puede modificarse.'
                  : 'Lo estás escribiendo a mano. Debe ser único.'
              }
            />
          ) : (
            <div className="flex flex-col justify-center">
              <span className="mb-1.5 block text-sm font-semibold text-dark">Código</span>
              <p className="rounded-lg bg-slate-100 px-3 py-2 font-bold text-dark">{form.codigo}</p>
              <button
                type="button"
                onClick={() => setCodigoManual(true)}
                disabled={isSaving}
                className="mt-1.5 self-start text-xs font-semibold text-primary hover:underline"
              >
                Asignarlo a mano
              </button>
            </div>
          )}
          <Input
            label="Abreviatura"
            value={form.abreviatura}
            onChange={(event) => setForm((current) => ({ ...current, abreviatura: event.target.value }))}
            maxLength={50}
            required
            disabled={isSaving}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => handleNombreChange(event.target.value)}
            maxLength={255}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Nombre corto"
            value={form.nombre_corto}
            onChange={(event) => setForm((current) => ({ ...current, nombre_corto: event.target.value }))}
            maxLength={100}
            disabled={isSaving}
          />
          {slugManual ? (
            <Input
              label="Dirección en la web"
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: generarSlug(event.target.value) }))
              }
              maxLength={255}
              hint={
                editingPrograma
                  ? 'Cuidado: cambiarla rompe el enlace que ya esté publicado.'
                  : 'La estás escribiendo a mano.'
              }
              disabled={isSaving}
            />
          ) : (
            <div className="flex flex-col justify-center">
              <span className="mb-1.5 block text-sm font-semibold text-dark">Dirección en la web</span>
              <p className="truncate rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                /{form.slug || '…'}
              </p>
              <button
                type="button"
                onClick={() => setSlugManual(true)}
                disabled={isSaving}
                className="mt-1.5 self-start text-xs font-semibold text-primary hover:underline"
              >
                Editarla a mano
              </button>
            </div>
          )}
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(event) => handleTipoChange(event.target.value as ProgramaTipo)}
            required
            disabled={isSaving}
          >
            <option value="carrera">Carrera</option>
            <option value="auxiliar">Auxiliar</option>
            <option value="especializacion">Especialización</option>
            <option value="curso">Curso</option>
          </Select>
          <Input
            label="Categoría"
            value={form.categoria}
            onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
            maxLength={100}
            required
            disabled={isSaving}
          />
          <Input
            label="Malla curricular"
            value={form.malla}
            onChange={(event) => setForm((current) => ({ ...current, malla: event.target.value }))}
            maxLength={255}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Año"
            type="number"
            min={1}
            step={1}
            value={form.anio}
            onChange={(event) => setForm((current) => ({ ...current, anio: event.target.value }))}
            required
            disabled={isSaving}
          />
          <Input
            label="Número de lecciones"
            type="number"
            min={0}
            step={1}
            value={form.num_lecciones}
            onChange={(event) => setForm((current) => ({ ...current, num_lecciones: event.target.value }))}
            required
            disabled={isSaving}
          />
          </div>

          <div className="grid gap-5 sm:grid-cols-2" hidden={seccionActiva !== 'ficha'}>
          <Input
            label="Duración"
            value={form.duracion}
            onChange={(event) => setForm((current) => ({ ...current, duracion: event.target.value }))}
            placeholder="Ej. 4 semanas"
            disabled={isSaving}
          />
          <Input
            label="Modalidad"
            value={form.modalidad}
            onChange={(event) => setForm((current) => ({ ...current, modalidad: event.target.value }))}
            placeholder="Ej. 100% Virtual"
            disabled={isSaving}
          />
          <div className="sm:col-span-2">
            <ImageUploadField label="Imagen de portada" value={form.imagen_url} onChange={(value) => setForm((current) => ({ ...current, imagen_url: value }))} disabled={isSaving} />
          </div>
          <Input
            label="Subtítulo"
            value={form.subtitulo}
            onChange={(event) => setForm((current) => ({ ...current, subtitulo: event.target.value }))}
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Tutor"
            value={form.tutor}
            onChange={(event) => setForm((current) => ({ ...current, tutor: event.target.value }))}
            maxLength={255}
            disabled={isSaving}
          />
          <Textarea
            label="Descripción"
            rows={4}
            value={form.descripcion}
            onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
            disabled={isSaving}
            hint="El texto principal que se lee en la ficha del programa."
            containerClassName="sm:col-span-2"
          />
          <Textarea
            label="Dirigido a"
            rows={3}
            value={form.dirigido_a}
            onChange={(event) => setForm((current) => ({ ...current, dirigido_a: event.target.value }))}
            disabled={isSaving}
            hint="A qué perfil de persona está pensado."
            containerClassName="sm:col-span-2"
          />
          <ListEditor
            className="sm:col-span-2"
            label="Contenidos"
            hint="Los temas que cubre el programa."
            placeholder="Ej. Primeros auxilios básicos"
            textoAgregar="Añadir contenido"
            value={form.contenidos}
            onChange={(contenidos) => setForm((current) => ({ ...current, contenidos }))}
            disabled={isSaving}
          />
          <div className="sm:col-span-2">
            <PairListEditor
              label="Malla detallada"
              hint="Un periodo por fila, con los cursos que lo componen separados por punto y coma."
              etiquetaPrimero="Periodo"
              etiquetaSegundo="Cursos"
              placeholderPrimero="Ej. Ciclo I"
              placeholderSegundo="Anatomía; Primeros auxilios; Ética"
              textoAgregar="Añadir periodo"
              value={form.malla_curricular}
              onChange={(malla_curricular) => setForm((current) => ({ ...current, malla_curricular }))}
              disabled={isSaving}
            />
          </div>
          <ListEditor
            label="Requisitos"
            hint="Lo que necesita quien quiera inscribirse."
            placeholder="Ej. Certificado de secundaria"
            textoAgregar="Añadir requisito"
            value={form.requisitos}
            onChange={(requisitos) => setForm((current) => ({ ...current, requisitos }))}
            disabled={isSaving}
          />
          <ListEditor
            label="Certificaciones"
            hint="El certificado que recibe el alumno y los sellos que respaldan su validez, como la norma ISO."
            placeholder="Ej. Certificado de aprobación · Certificación Internacional ISO 21001"
            textoAgregar="Añadir certificación"
            value={form.certificaciones}
            onChange={(certificaciones) => setForm((current) => ({ ...current, certificaciones }))}
            disabled={isSaving}
          />
          <div className="sm:col-span-2">
            <PairListEditor
              label="Campo laboral"
              hint="Dónde puede trabajar quien egresa del programa."
              etiquetaPrimero="Puesto o lugar"
              etiquetaSegundo="Descripción breve"
              placeholderPrimero="Ej. Técnico en farmacia"
              placeholderSegundo="Atención en boticas y farmacias"
              textoAgregar="Añadir salida laboral"
              value={form.campo_laboral}
              onChange={(campo_laboral) => setForm((current) => ({ ...current, campo_laboral }))}
              disabled={isSaving}
            />
          </div>
          <Input label="Titulación" value={form.titulacion} onChange={(event) => setForm((current) => ({ ...current, titulacion: event.target.value }))} disabled={isSaving} />
          <ImageUploadField label="Imagen de malla" value={form.malla_imagen_url} onChange={(value) => setForm((current) => ({ ...current, malla_imagen_url: value }))} disabled={isSaving} />
          <Input label="Convenio" value={form.convenio_nombre} onChange={(event) => setForm((current) => ({ ...current, convenio_nombre: event.target.value }))} disabled={isSaving} />
          <ImageUploadField label="Logo del convenio" value={form.convenio_logo_url} onChange={(value) => setForm((current) => ({ ...current, convenio_logo_url: value }))} disabled={isSaving} />
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-4 py-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.certificado}
              onChange={(event) => setForm((current) => ({ ...current, certificado: event.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            <span className="text-sm font-semibold text-dark">Incluye certificado</span>
          </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2" hidden={seccionActiva !== 'publicacion'}>
          <Select
            label="Estado"
            value={form.estado}
            onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value as ProgramaEstado }))}
            required
            disabled={isSaving}
          >
            <option value="no_publicado">No publicado</option>
            <option value="publicado">Publicado</option>
            <option value="archivado" disabled>Archivado</option>
          </Select>
          <Input
            label="Publicación programada"
            type="datetime-local"
            value={form.publicacion_programada}
            onChange={(event) => setForm((current) => ({ ...current, publicacion_programada: event.target.value }))}
            disabled={isSaving}
          />
          <Textarea
            label="Mensaje de WhatsApp"
            rows={3}
            value={form.mensaje_whatsapp}
            onChange={(event) => setForm((current) => ({ ...current, mensaje_whatsapp: event.target.value }))}
            disabled={isSaving}
            hint="Texto que se escribe solo cuando alguien pulsa el botón de WhatsApp desde este programa."
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Título SEO"
            value={form.seo_titulo}
            onChange={(event) => setForm((current) => ({ ...current, seo_titulo: event.target.value }))}
            disabled={isSaving}
            hint="Cómo aparece el título en Google. Si lo dejas vacío se usa el nombre del programa."
            containerClassName="sm:col-span-2"
          />
          <Textarea
            label="Descripción SEO"
            rows={3}
            value={form.seo_descripcion}
            onChange={(event) => setForm((current) => ({ ...current, seo_descripcion: event.target.value }))}
            disabled={isSaving}
            hint="El resumen que Google muestra debajo del título."
            containerClassName="sm:col-span-2"
          />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={confirmandoDescarte}
        onClose={() => setConfirmandoDescarte(false)}
        title="Cambios sin guardar"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmandoDescarte(false)}>
              Seguir editando
            </Button>
            <Button variant="danger" onClick={cerrarFormulario}>
              Descartar cambios
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          Hiciste cambios que todavía no se han guardado. Si cierras ahora se perderán.
        </p>
      </Modal>

      <Modal
        isOpen={Boolean(programaToArchive)}
        onClose={closeArchiveModal}
        title="Archivar programa"
        size="sm"
        closeOnBackdrop={!isArchiving}
        footer={
          <>
            <Button variant="ghost" onClick={closeArchiveModal} disabled={isArchiving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleArchive} isLoading={isArchiving}>
              Sí, archivar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que deseas archivar{' '}
          <strong>{programaToArchive?.nombre}</strong>? El registro seguirá disponible en el
          historial con estado archivado.
        </p>
        {archiveError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {archiveError}
          </div>
        )}
      </Modal>
    </main>
  )
}
