import { useEffect, useState } from 'react'
import { FaLayerGroup, FaShoppingCart } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { listarCombosPublicos } from '@/services/combosApi'
import { useCart } from '@/hooks/useCart'
import type { ComboBackend } from '@/types/backend'

export default function CombosSection() {
  const { addItem } = useCart()
  const [combos, setCombos] = useState<ComboBackend[]>([])

  useEffect(() => {
    let active = true
    listarCombosPublicos()
      .then((data) => {
        if (active) setCombos(data.filter((combo) => combo.monto !== null).slice(0, 3))
      })
      .catch(() => {
        if (active) setCombos([])
      })
    return () => {
      active = false
    }
  }, [])

  if (combos.length === 0) return null

  return (
    <section className="border-y border-primary/10 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <FaLayerGroup aria-hidden="true" />
              Paquetes especiales
            </div>
            <h2 className="text-2xl font-bold text-deep sm:text-3xl">Combos académicos</h2>
            <p className="mt-2 max-w-2xl text-sm text-deep/65 sm:text-base">
              Combina programas y obtén una opción de formación completa en un solo paquete.
            </p>
          </div>
          <Link to="/programas-de-estudio" className="text-sm font-bold text-primary hover:underline">
            Ver todos los combos
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => {
            const product = {
              slug: `combo-${combo.id}`,
              title: combo.nombre,
              shortTitle: combo.nombre,
              duration: `${combo.programa_nombres.length} programas incluidos`,
              modality: 'Paquete académico',
              description: combo.descripcion || combo.programa_nombres.join(', '),
              image: '/assets/img/programs/cursos.webp',
              category: 'curso' as const,
              culqiLink: combo.enlace_pago || undefined,
            }

            return (
              <article key={combo.id} className="rounded-2xl border border-primary/15 bg-surface p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h3 className="font-bold leading-tight text-deep">{combo.nombre}</h3>
                  <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                    S/ {Number(combo.monto).toFixed(2)}
                  </span>
                </div>
                <p className="min-h-10 text-sm text-deep/65">{product.description}</p>
                <button
                  type="button"
                  onClick={() => addItem(product, Number(combo.monto), 'Combo')}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  <FaShoppingCart aria-hidden="true" />
                  Agregar al carrito
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
