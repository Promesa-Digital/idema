import { useEffect, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { checkSystemStatus } from '@/services/systemApi'
import type { SystemStatus } from '@/services/systemApi'

const INITIAL_STATUS: SystemStatus = { status: 'checking', label: 'Comprobando conexión' }

const STATUS_CLASSES: Record<SystemStatus['status'], string> = {
  checking: 'bg-slate-100 text-slate-600',
  online: 'bg-emerald-50 text-emerald-700',
  backend_offline: 'bg-red-50 text-red-700',
  database_offline: 'bg-amber-50 text-amber-800',
}

const DOT_CLASSES: Record<SystemStatus['status'], string> = {
  checking: 'bg-slate-400',
  online: 'bg-emerald-500',
  backend_offline: 'bg-red-500',
  database_offline: 'bg-amber-500',
}

interface SystemStatusBadgeProps {
  compact?: boolean
}

export default function SystemStatusBadge({ compact = false }: SystemStatusBadgeProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(INITIAL_STATUS)

  const refresh = async () => {
    setSystemStatus((current) => ({ ...current, status: 'checking', label: 'Comprobando conexión' }))
    setSystemStatus(await checkSystemStatus())
  }

  useEffect(() => {
    const refreshStatus = () => {
      void checkSystemStatus().then(setSystemStatus)
    }

    refreshStatus()
    const intervalId = window.setInterval(refreshStatus, 30000)
    window.addEventListener('online', refreshStatus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('online', refreshStatus)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition hover:brightness-95 ${STATUS_CLASSES[systemStatus.status]}`}
      aria-label={`${systemStatus.label}. Volver a comprobar.`}
      title="Comprobar nuevamente"
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${DOT_CLASSES[systemStatus.status]} ${systemStatus.status === 'checking' ? 'animate-pulse' : ''}`}
      />
      {!compact && <span>{systemStatus.label}</span>}
      <FiRefreshCw
        aria-hidden="true"
        className={systemStatus.status === 'checking' ? 'animate-spin' : ''}
      />
    </button>
  )
}
