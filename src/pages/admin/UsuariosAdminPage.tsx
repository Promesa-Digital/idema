import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AdminModuleNav from '@/components/admin/AdminModuleNav'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
} from '@/services/usuariosApi'
import type {
  UsuarioCreate,
  UsuarioDirectorio,
  UsuarioRol,
  UsuarioUpdate,
} from '@/types/backend'

interface UsuarioFormState {
  nombre: string
  correo: string
  password: string
  rol: UsuarioRol
  estado: UsuarioDirectorio['estado']
}

const EMPTY_FORM: UsuarioFormState = {
  nombre: '',
  correo: '',
  password: '',
  rol: 'marketing',
  estado: 'activo',
}

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const ROL_OPTIONS = Object.entries(ROL_LABELS) as Array<[UsuarioRol, string]>

const ESTADO_LABELS: Record<UsuarioDirectorio['estado'], string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

const ESTADO_BADGE_VARIANTS = {
  activo: 'emerald',
  inactivo: 'slate',
} as const

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function toFormState(usuario: UsuarioDirectorio): UsuarioFormState {
  return {
    nombre: usuario.nombre,
    correo: '',
    password: '',
    rol: usuario.rol,
    estado: usuario.estado,
  }
}

export default function UsuariosAdminPage() {
  const { user, logout } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioDirectorio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [editingUsuario, setEditingUsuario] = useState<UsuarioDirectorio | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<UsuarioFormState>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [usuarioToDeactivate, setUsuarioToDeactivate] = useState<UsuarioDirectorio | null>(null)
  const [deactivateError, setDeactivateError] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)

  useEffect(() => {
    let isActive = true

    listarUsuarios()
      .then((data) => {
        if (isActive) setUsuarios(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudieron cargar los usuarios.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, reloadKey])

  const usuariosOrdenados = useMemo(
    () => [...usuarios].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es')),
    [usuarios],
  )

  const syncUsuario = useCallback((updated: UsuarioDirectorio) => {
    setUsuarios((current) => {
      const exists = current.some((usuario) => usuario.id === updated.id)
      return exists
        ? current.map((usuario) => (usuario.id === updated.id ? updated : usuario))
        : [updated, ...current]
    })
  }, [])

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingUsuario(null)
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingUsuario(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((usuario: UsuarioDirectorio) => {
    setEditingUsuario(usuario)
    setForm(toFormState(usuario))
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openDeactivateModal = useCallback((usuario: UsuarioDirectorio) => {
    setUsuarioToDeactivate(usuario)
    setDeactivateError('')
  }, [])

  const closeDeactivateModal = useCallback(() => {
    if (isDeactivating) return
    setUsuarioToDeactivate(null)
    setDeactivateError('')
  }, [isDeactivating])

  const columns = useMemo<TableColumn<UsuarioDirectorio>[]>(
    () => [
      {
        key: 'nombre',
        header: 'Nombre',
        render: (usuario) => <span className="font-semibold text-dark">{usuario.nombre}</span>,
      },
      {
        key: 'correo',
        header: 'Correo',
        render: (usuario) => usuario.correo,
      },
      {
        key: 'rol',
        header: 'Rol',
        render: (usuario) => ROL_LABELS[usuario.rol],
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (usuario) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[usuario.estado]}>
            {ESTADO_LABELS[usuario.estado]}
          </Badge>
        ),
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (usuario) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(usuario)}>
              Editar
            </Button>
            {usuario.estado === 'activo' && (
              <Button size="sm" variant="danger" onClick={() => openDeactivateModal(usuario)}>
                Desactivar
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openDeactivateModal, openEditModal],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')

    const nombre = form.nombre.trim()
    const correo = form.correo.trim()
    const password = form.password

    if (!nombre) {
      setFormError('Ingresa el nombre del usuario.')
      return
    }
    if (!editingUsuario && !correo) {
      setFormError('Ingresa el correo del usuario.')
      return
    }
    if ((!editingUsuario || password) && password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setIsSaving(true)

    try {
      let saved: UsuarioDirectorio

      if (editingUsuario) {
        const payload: UsuarioUpdate = {
          nombre,
          rol: form.rol,
          estado: form.estado,
        }
        if (password) payload.password = password
        saved = await actualizarUsuario(editingUsuario.id, payload)
      } else {
        const payload: UsuarioCreate = {
          nombre,
          correo,
          password,
          rol: form.rol,
        }
        saved = await crearUsuario(payload)
      }

      syncUsuario(saved)
      setFeedback(
        editingUsuario
          ? `${saved.nombre} se actualizó correctamente.`
          : `${saved.nombre} se creó correctamente.`,
      )
      setIsFormOpen(false)
      setEditingUsuario(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setFormError(getErrorMessage(error, 'No se pudo guardar el usuario.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!usuarioToDeactivate) return
    setDeactivateError('')
    setFeedback('')
    setIsDeactivating(true)

    try {
      const deactivated = await eliminarUsuario(usuarioToDeactivate.id)
      syncUsuario(deactivated)
      setFeedback(`${deactivated.nombre} fue desactivado.`)
      setUsuarioToDeactivate(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setDeactivateError(getErrorMessage(error, 'No se pudo desactivar el usuario.'))
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Usuarios y Roles</h1>
            <AdminModuleNav role={user?.rol} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm sm:text-right">
              <p className="font-semibold">{user?.nombre}</p>
              <p className="text-white/70">{user ? ROL_LABELS[user.rol] : ''}</p>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-dark">Usuarios registrados</h2>
            <p className="mt-1 text-sm text-slate-600">
              Administra el acceso, los roles y el estado del equipo de IDEMA.
            </p>
          </div>
          <Button size="lg" onClick={openCreateModal}>
            Nuevo usuario
          </Button>
        </div>

        {feedback && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando usuarios...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">
              {loadError}
            </p>
            <Button variant="secondary" onClick={handleRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {usuariosOrdenados.length}{' '}
              {usuariosOrdenados.length === 1 ? 'usuario disponible' : 'usuarios disponibles'}
            </p>
            <Table
              columns={columns}
              data={usuariosOrdenados}
              getRowKey={(usuario) => usuario.id}
              caption="Listado de usuarios"
              emptyMessage="No hay usuarios registrados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingUsuario ? 'Editar usuario' : 'Nuevo usuario'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="usuario-form" isLoading={isSaving}>
              {editingUsuario ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </>
        }
      >
        <form
          id="usuario-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-5 sm:grid-cols-2"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
            >
              {formError}
            </div>
          )}

          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) =>
              setForm((current) => ({ ...current, nombre: event.target.value }))
            }
            maxLength={255}
            autoComplete="name"
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />

          {!editingUsuario && (
            <Input
              label="Correo"
              type="email"
              value={form.correo}
              onChange={(event) =>
                setForm((current) => ({ ...current, correo: event.target.value }))
              }
              autoComplete="email"
              required
              disabled={isSaving}
            />
          )}

          <Input
            label={editingUsuario ? 'Nueva contraseña' : 'Contraseña'}
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            autoComplete="new-password"
            required={!editingUsuario}
            hint={
              editingUsuario
                ? 'Déjala en blanco para mantener la contraseña actual.'
                : 'Mínimo 8 caracteres.'
            }
            disabled={isSaving}
          />

          <Select
            label="Rol"
            value={form.rol}
            onChange={(event) =>
              setForm((current) => ({ ...current, rol: event.target.value as UsuarioRol }))
            }
            required
            disabled={isSaving}
          >
            {ROL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          {editingUsuario && (
            <Select
              label="Estado"
              value={form.estado}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estado: event.target.value as UsuarioDirectorio['estado'],
                }))
              }
              required
              disabled={isSaving}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Select>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(usuarioToDeactivate)}
        onClose={closeDeactivateModal}
        title="Desactivar usuario"
        size="sm"
        closeOnBackdrop={!isDeactivating}
        footer={
          <>
            <Button variant="ghost" onClick={closeDeactivateModal} disabled={isDeactivating}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={isDeactivating}>
              Sí, desactivar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que deseas desactivar a{' '}
          <strong>{usuarioToDeactivate?.nombre}</strong>? El usuario perderá el acceso, pero su
          registro se conservará.
        </p>
        {deactivateError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {deactivateError}
          </div>
        )}
      </Modal>
    </main>
  )
}
