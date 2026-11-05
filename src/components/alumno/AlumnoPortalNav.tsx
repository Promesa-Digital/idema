import { ALUMNO_PORTAL_TABS } from './alumnoPortalTabs'
import type { AlumnoPortalTab } from './alumnoPortalTabs'

interface AlumnoPortalNavProps {
  activeTab: AlumnoPortalTab
  onChange: (tab: AlumnoPortalTab) => void
}

export default function AlumnoPortalNav({ activeTab, onChange }: AlumnoPortalNavProps) {
  return (
    <>
      <nav aria-label="Secciones de mi cuenta" className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:flex sm:px-6 lg:px-8">
        {ALUMNO_PORTAL_TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => onChange(item.id)} className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === item.id ? 'bg-white text-dark' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
            <item.icon aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>

      <nav aria-label="Secciones de mi cuenta" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] sm:hidden">
        {ALUMNO_PORTAL_TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => onChange(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.65rem] font-bold transition ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}>
            <item.icon aria-hidden="true" className="h-5 w-5" />
            <span className="truncate">{item.shortLabel}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
