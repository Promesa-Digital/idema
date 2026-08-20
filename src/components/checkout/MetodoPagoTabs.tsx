import { FiCreditCard, FiRepeat, FiSmartphone } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import type { MetodoPago } from '../../types/checkout'

interface MetodoPagoTabsProps {
  value: MetodoPago
  onChange: (metodo: MetodoPago) => void
  disabled?: boolean
}

const TABS: { value: MetodoPago; label: string; icon: IconType }[] = [
  { value: 'tarjeta', label: 'Tarjeta', icon: FiCreditCard },
  { value: 'yape', label: 'Yape', icon: FiSmartphone },
  { value: 'transferencia', label: 'Transferencia', icon: FiRepeat },
]

export default function MetodoPagoTabs({ value, onChange, disabled }: MetodoPagoTabsProps) {
  return (
    <div role="tablist" aria-label="Método de pago" className="grid grid-cols-3 gap-2 mb-8">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(tab.value)}
            className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? 'border-primary bg-primary/10 text-white shadow-[0_0_0_1px_rgba(0,175,240,0.4)]'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="text-xl" aria-hidden />
            <span className="text-xs font-semibold">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
