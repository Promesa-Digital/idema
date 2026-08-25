import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiUserCheck, FiUserX } from 'react-icons/fi'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios'
import type { Usuario, UsuarioRol } from '../../types'
import { ROLE_LABELS } from '../../types/auth'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Button from '../../components/ui/Button'
import { iconButtonClasses } from '../../components/ui/buttonVariants'
import FormInput from '../../components/ui/FormInput'
import { useToast } from '../../hooks/useToast'

const USUARIOS_QUERY_KEY = ['admin', 'usuarios'] as const

/** El rol "alumno" existe en UserRole pero nunca es un rol de staff: se excluye a propósito. */
const USUARIO_ROLES: UsuarioRol[] = ['marketing', 'director_marketing', 'ventas', 'academico', 'administracion', 'admin_sistema']

const selectClass =
  'w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] px-[14px] py-[10px] text-sm text-[var(--color-text-main)] outline-none transition-colors focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(0,175,240,0.1)]'

export default function UsuariosAdminPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [editando, setEditando] = useState<Usuario | null>(null)
  const [paraCambiarEstado, setParaCambiarEstado] = useState<Usuario | null>(null)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)

  const { data, isLoading, isError } = useQuery({ queryKey: USUARIOS_QUERY_KEY, queryFn: getUsuarios })
  const usuarios = data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY })

  const estadoMutation = useMutation({
    mutationFn: (usuario: Usuario) =>
      usuario.estado === 'activo' ? deleteUsuario(usuario.id) : updateUsuario(usuario.id, { estado: 'activo' }),
    onSuccess: (_data, usuario) => {
      invalidate()
      setParaCambiarEstado(null)
      addToast('success', usuario.estado === 'activo' ? 'Usuario desactivado' : 'Usuario activado', 'El cambio se guardó correctamente.')
    },
    onError: () => addToast('error', 'No se pudo actualizar el estado', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Usuario>[] = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Rol', accessor: 'rol', render: (u) => <Badge value={u.rol} /> },
    { header: 'Estado', accessor: 'estado', render: (u) => <Badge value={u.estado} /> },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (usuario) => (
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setEditando(usuario)} className={iconButtonClasses('ghost')} title="Editar">
            <FiEdit2 />
          </button>
          <button
            type="button"
            onClick={() => setParaCambiarEstado(usuario)}
            className={iconButtonClasses(usuario.estado === 'activo' ? 'destructive' : 'primary')}
            title={usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
          >
            {usuario.estado === 'activo' ? <FiUserX /> : <FiUserCheck />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Helmet>
        <title>Usuarios - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader
        title="Usuarios"
        subtitle="Gestiona las cuentas de staff y sus roles."
        action={<Button variant="primary" onClick={() => setMostrarNuevo(true)}>Crear usuario</Button>}
      />

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar los usuarios. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={usuarios}
          isLoading={isLoading}
          emptyMessage="No hay usuarios registrados."
          getRowKey={(u) => u.id}
        />
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onCambiarEstado={(usuario) => setParaCambiarEstado(usuario)}
        />
      )}

      <NuevoUsuarioModal isOpen={mostrarNuevo} onClose={() => setMostrarNuevo(false)} />

      <ConfirmModal
        isOpen={!!paraCambiarEstado}
        title={paraCambiarEstado?.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          paraCambiarEstado?.estado === 'activo'
            ? `${paraCambiarEstado?.nombre} perderá acceso al panel administrativo. Su historial se conserva.`
            : `${paraCambiarEstado?.nombre} volverá a tener acceso al panel administrativo.`
        }
        variant={paraCambiarEstado?.estado === 'activo' ? 'destructive' : 'default'}
        confirmText={paraCambiarEstado?.estado === 'activo' ? 'Desactivar' : 'Activar'}
        isConfirming={estadoMutation.isPending}
        onCancel={() => setParaCambiarEstado(null)}
        onConfirm={() => paraCambiarEstado && estadoMutation.mutate(paraCambiarEstado)}
      />
    </>
  )
}

function EditarUsuarioModal({
  usuario,
  onClose,
  onCambiarEstado,
}: {
  usuario: Usuario
  onClose: () => void
  onCambiarEstado: (usuario: Usuario) => void
}) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState(usuario.nombre)
  const [rol, setRol] = useState<UsuarioRol>(usuario.rol)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => updateUsuario(usuario.id, { nombre, rol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY })
      addToast('success', 'Usuario actualizado', 'Los cambios se guardaron correctamente.')
      onClose()
    },
    onError: () => setError('No se pudo guardar los cambios. Intenta nuevamente.'),
  })

  return (
    <Modal isOpen onClose={onClose} title="Editar usuario">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mutation.mutate()
        }}
      >
        {error && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{error}</p>}

        <FormInput label="Nombre" value={nombre} onChange={setNombre} />
        <FormInput label="Correo" value={usuario.correo} onChange={() => {}} readonly hint="El correo no se puede modificar." />

        <div style={{ fontFamily: 'var(--font-body)' }}>
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]" htmlFor="usuario-rol">
            Rol
          </label>
          <select id="usuario-rol" value={rol} onChange={(e) => setRol(e.target.value as UsuarioRol)} className={selectClass}>
            {USUARIO_ROLES.map((value) => (
              <option key={value} value={value}>{ROLE_LABELS[value]}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
            Estado
          </p>
          <div className="flex items-center gap-3">
            <Badge value={usuario.estado} />
            <Button
              type="button"
              variant={usuario.estado === 'activo' ? 'destructive' : 'primary'}
              className="px-3 py-1.5 text-xs"
              onClick={() => {
                onCambiarEstado(usuario)
                onClose()
              }}
            >
              {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const emptyNuevoUsuario = { nombre: '', correo: '', password: '', rol: 'marketing' as UsuarioRol }

function NuevoUsuarioModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [values, setValues] = useState(emptyNuevoUsuario)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => createUsuario(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY })
      addToast('success', 'Usuario creado', 'La cuenta se creó correctamente.')
      setValues(emptyNuevoUsuario)
      onClose()
    },
    onError: () => setError('No se pudo crear el usuario. Verifica los datos e intenta nuevamente.'),
  })

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear usuario">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mutation.mutate()
        }}
      >
        {error && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{error}</p>}

        <FormInput label="Nombre" value={values.nombre} onChange={(nombre) => setValues((v) => ({ ...v, nombre }))} required />
        <FormInput label="Correo" type="email" value={values.correo} onChange={(correo) => setValues((v) => ({ ...v, correo }))} required />
        <FormInput
          label="Contraseña"
          type="password"
          value={values.password}
          onChange={(password) => setValues((v) => ({ ...v, password }))}
          hint="Mínimo 8 caracteres."
          minLength={8}
          required
        />

        <div style={{ fontFamily: 'var(--font-body)' }}>
          <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]" htmlFor="nuevo-usuario-rol">
            Rol
          </label>
          <select
            id="nuevo-usuario-rol"
            value={values.rol}
            onChange={(e) => setValues((v) => ({ ...v, rol: e.target.value as UsuarioRol }))}
            className={selectClass}
          >
            {USUARIO_ROLES.map((value) => (
              <option key={value} value={value}>{ROLE_LABELS[value]}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando...' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
