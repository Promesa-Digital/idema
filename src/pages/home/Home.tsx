import { Helmet } from 'react-helmet-async'
import Hero from '../../components/home/Hero'
import Features from '../../components/home/Features'
import ProgramasSection from '../../components/home/ProgramasSection'
import CombosSection from '../../components/home/CombosSection'
import NewsSection from '../../components/home/NewsSection'
import ValuesSection from '../../components/home/ValuesSection'
import TestimonialsSection from '../../components/home/TestimonialsSection'
import CompaniesSection from '../../components/home/CompaniesSection'
import ContactSection from '../../components/home/ContactSection'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Instituto IDEMA - Transformando la Educación</title>
        <meta name="description" content="Instituto Superior Tecnológico IDEMA - Programas de estudio, cursos y especializaciones en Arequipa, Perú. +30 años de experiencia educativa." />
      </Helmet>
      <Hero />
      <Features />
      <ProgramasSection />
      <CombosSection />
      <NewsSection />
      <ValuesSection />
      <TestimonialsSection />
      <CompaniesSection />
      <ContactSection />
    </>
  )
}
