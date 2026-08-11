import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown } from 'react-icons/fa'
import type { AreaAccion } from '../../data/bienestar'

interface Props {
  areas: AreaAccion[]
}

export default function Accordion({ areas }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      {areas.map((area, index) => {
        const isOpen = expandedIndex === index
        const panelId = `bienestar-area-panel-${index}`
        const buttonId = `bienestar-area-button-${index}`
        return (
          <motion.div
            key={area.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-deep/10 hover:border-primary/30 transition-all duration-300 overflow-hidden"
          >
            <button
              id={buttonId}
              type="button"
              onClick={() => setExpandedIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 bg-surface hover:bg-surface transition-colors text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-dark text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-deep">{area.title}</h3>
              </span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0">
                <FaChevronDown className="text-primary text-lg" aria-hidden="true" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ul className="px-5 sm:px-6 py-5 bg-white border-t-2 border-deep/10 space-y-4">
                    {area.items.map(item => (
                      <li key={item.label}>
                        <p className="text-deep leading-relaxed">
                          <span className="font-semibold">{item.label}</span>
                          {item.text && <span>: {item.text}</span>}
                        </p>
                        {item.subItems && (
                          <ul className="mt-2 ml-4 space-y-2 border-l-2 border-primary/20 pl-4">
                            {item.subItems.map(sub => (
                              <li key={sub.label} className="text-sm text-deep/90 leading-relaxed">
                                <span className="font-semibold">{sub.label}</span>: {sub.text}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
