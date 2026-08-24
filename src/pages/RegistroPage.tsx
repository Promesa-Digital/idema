import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { registrarAlumno, type RegistroAlumnoValues } from '../api/registro'

const initial: RegistroAlumnoValues = { nombres: '', apellidos: '', dni: '', correo: '', telefono: '', password: '', consentimiento: true }
const fields = [['nombres', 'Nombres'], ['apellidos', 'Apellidos'], ['dni', 'DNI'], ['correo', 'Correo electrónico'], ['telefono', 'Teléfono'], ['password', 'Contraseña']] as const

export default function RegistroPage() {
  const navigate = useNavigate(); const [values, setValues] = useState(initial); const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); if (values.dni.length !== 8 || !/^\d+$/.test(values.dni)) { setError('El DNI debe contener 8 dígitos.'); return }; setSaving(true); try { await registrarAlumno(values); navigate('/login', { state: { registeredEmail: values.correo } }) } catch (err) { setError(isAxiosError(err) ? String(err.response?.data?.detail ?? 'No se pudo completar el registro.') : 'No se pudo completar el registro.') } finally { setSaving(false) } }
  return <><Helmet><title>Registro - IDEMA</title></Helmet><div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark flex items-center justify-center px-6 py-24"><form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-8"><div><h1 className="text-3xl font-bold text-white">Crea tu cuenta</h1><p className="mt-2 text-white/70">Regístrate para ingresar al portal del alumno.</p></div>{error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-100" role="alert">{error}</p>}{fields.map(([name, label]) => <label key={name} className="block text-sm font-semibold text-white">{label}<input required type={name === 'password' ? 'password' : name === 'correo' ? 'email' : 'text'} value={values[name]} onChange={(event) => setValues((previous) => ({ ...previous, [name]: event.target.value }))} className="mt-1 w-full rounded-lg bg-white px-3 py-2.5 text-deep" /></label>)}<label className="flex items-start gap-2 text-sm text-white/80"><input type="checkbox" checked readOnly /> Acepto el tratamiento de mis datos personales.</label><button disabled={saving} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Registrando...' : 'Crear cuenta'}</button></form></div></>
}