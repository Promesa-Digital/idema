import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MdFormatQuote } from 'react-icons/md'
import { FaStar } from 'react-icons/fa'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'

import { testimonios } from '../../data/testimonios'

import 'swiper/swiper-bundle.css'

function StarRating() {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} className="text-cta text-lg" />
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  const { ref, inView } = useInView({ triggerOnce: true })

  return (
    <section
      ref={ref}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-dark to-deep"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Lo Que Dicen Nuestros Egresados
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            Miles de profesionales han transformado sus vidas a través de nuestros programas educativos. Aquí puedes conocer sus historias de éxito.
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-cta rounded-full mx-auto mt-4" />
        </motion.div>

        {/* Swiper carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            spaceBetween={24}
            loop
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-12 testimonios-swiper"
          >
            {testimonios.map((t, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  whileHover={{ translateY: -10 }}
                  className="h-full"
                >
                  <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 sm:p-8 h-full hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-xl flex flex-col">
                    {/* Header: quote + stars */}
                    <div className="flex items-center justify-between mb-4">
                      <MdFormatQuote className="text-primary text-3xl" />
                      <StarRating />
                    </div>

                    {/* Quote text */}
                    <p
                      className="text-white/80 text-sm leading-relaxed mb-6 italic flex-1"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      "{t.text}"
                    </p>

                    {/* Divider */}
                    <div className="h-1 bg-gradient-to-r from-primary/60 to-cta/40 rounded-full mb-6" />

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-deep overflow-hidden flex-shrink-0 shadow-lg"
                      >
                        <img
                          src={t.image}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </motion.div>
                      <div>
                        <p className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>
                          {t.name}
                        </p>
                        <p className="text-primary text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>
    </section>
  )
}
