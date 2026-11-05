import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ROLE_LABELS } from '@/components/admin/adminModules'
import { useAuth } from '@/context/AuthContextType'
import { actualizarMiPassword, actualizarMiPerfil } from '@/services/authApi'
import { ApiError } from '@/services/apiClient'

function mensajeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo guardar el cambio.'
}

export default function MiPerfilAdminPage() {
  const { user, refreshUser } = useAuth()
  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [password, setPassword] = useState({ actual: '', nueva: '', confirmacion: '' })
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [mensajeNombre, setMensajeNombre] = useState('')
  const [mensajePassword, setMensajePassword] = useState('')
  const [errorNombre, setErrorNombre] = useState('')
  const [errorPassword, setErrorPassword] = useState('')

  useEffect(() => setNombre(user?.nombre ?? ''), [user?.nombre])

  const guardarNombre = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorNombre('')
    setMensajeNombre('')
    const nombreLimpio = nombre.trim().replace(/\s+/g, ' ')
    if (nombreLimpio.length < 2) {
      setErrorNombre('Escribe un nombre válido.')
      return
    }
    setGuardandoNombre(true)
    try {
      await actualizarMiPerfil(nombreLimpio)
      await refreshUser()
      setMensajeNombre('Tu nombre fue actualizado.')
    } catch (error) {
      setErrorNombre(mensajeError(error))
    } finally {
      setGuardandoNombre(false)
    }
  }

  const guardarPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorPassword('')
    setMensajePassword('')
    if (password.nueva !== password.confirmacion) {
      setErrorPassword('Las contraseñas nuevas no coinciden.')
      return
    }
    setGuardandoPassword(true)
    try {
      const response = await actualizarMiPassword(password.actual, password.nueva)
      setPassword({ actual: '', nueva: '', confirmacion: '' })
      setMensajePassword(response.mensaje)
    } catch (error) {
      setErrorPassword(mensajeError(error))
    } finally {
      setGuardandoPassword(false)
    }
  }

  if (!user) return null

  return (
    <main className="px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-dark">Datos personales</h2>
          <p className="mt-1 text-sm text-slate-500">Actualiza el nombre que se muestra en el panel.</p>
          <form onSubmit={guardarNombre} className="mt-6 space-y-5">
            <Input label="Nombre completo" value={nombre} onChange={(event) => setNombre(event.target.value)} minLength={2} maxLength={255} required disabled={guardandoNombre} />
            <Input label="Correo electrónico" value={user.correo} disabled hint="El correo solo puede cambiarlo un administrador del sistema." />
            <Input label="Rol" value={ROLE_LABELS[user.rol]} disabled />
            {errorNombre && <p role="alert" className="text-sm text-red-600">{errorNombre}</p>}
            {mensajeNombre && <p role="status" className="text-sm text-emerald-700">{mensajeNombre}</p>}
            <Button type="submit" isLoading={guardandoNombre} disabled={nombre.trim() === user.nombre}>Guardar nombre</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-dark">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-slate-500">Usa al menos 8 caracteres, un número y un símbolo.</p>
          <form onSubmit={guardarPassword} className="mt-6 space-y-5">
            <Input label="Contraseña actual" type="password" autoComplete="current-password" value={password.actual} onChange={(event) => setPassword((actual) => ({ ...actual, actual: event.target.value }))} required disabled={guardandoPassword} />
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={password.nueva} onChange={(event) => setPassword((actual) => ({ ...actual, nueva: event.target.value }))} minLength={8} maxLength={100} required disabled={guardandoPassword} />
            <Input label="Confirmar nueva contraseña" type="password" autoComplete="new-password" value={password.confirmacion} onChange={(event) => setPassword((actual) => ({ ...actual, confirmacion: event.target.value }))} minLength={8} maxLength={100} required disabled={guardandoPassword} />
            {errorPassword && <p role="alert" className="text-sm text-red-600">{errorPassword}</p>}
            {mensajePassword && <p role="status" className="text-sm text-emerald-700">{mensajePassword}</p>}
            <Button type="submit" isLoading={guardandoPassword}>Actualizar contraseña</Button>
          </form>
        </section>
      </div>
    </main>
  )
}
