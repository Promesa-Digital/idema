import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/home/Home'))
const ProgramDetailPage = lazy(() => import('./pages/programs/ProgramDetailPage'))
const CursoDetailPage = lazy(() => import('./pages/programs/CursoDetailPage'))
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const FranquiciatePage = lazy(() => import('./pages/FranquiciatePage'))
const InvestigacionPage = lazy(() => import('./pages/InvestigacionPage'))
const ServicioPage = lazy(() => import('./pages/ServicioPage'))
const LegalPage = lazy(() => import('./pages/legal/LegalPage'))
const LibroReclamacionesPage = lazy(() => import('./pages/legal/LibroReclamacionesPage'))
const EliminarCuentaPage = lazy(() => import('./pages/legal/EliminarCuentaPage'))
const CursosGratisPage = lazy(() => import('./pages/CursosGratisPage'))
const OrientacionVocacionalPage = lazy(() => import('./pages/OrientacionVocacionalPage'))
const NoticiasPage = lazy(() => import('./pages/NoticiasPage'))
const ProgramasPage = lazy(() => import('./pages/programs/ProgramasPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* Programas */}
          <Route path="programas" element={<ProgramasPage />} />
          {/* Detalle de programas */}
          <Route path="carreras/:slug" element={<ProgramDetailPage />} />
          <Route path="auxiliares/:slug" element={<ProgramDetailPage />} />
          <Route path="especializaciones/:slug" element={<ProgramDetailPage />} />
          <Route path="cursos/:slug" element={<CursoDetailPage />} />
          {/* Servicios */}
          <Route path="servicios/:slug" element={<ServicioPage />} />
          {/* Institucional */}
          <Route path="nosotros" element={<NosotrosPage />} />
          <Route path="cursos-gratis" element={<CursosGratisPage />} />
          <Route path="idema-educa" element={<Navigate to="/programas" replace />} />
          <Route path="orientacion-vocacional" element={<OrientacionVocacionalPage />} />
          {/* Info pages */}
          <Route path="faq" element={<FAQPage />} />
          <Route path="franquiciate" element={<FranquiciatePage />} />
          <Route path="investigacion" element={<InvestigacionPage />} />
          <Route path="noticias" element={<NoticiasPage />} />
          {/* Legal */}
          <Route path="politica-privacidad" element={<LegalPage />} />
          <Route path="terminos-y-condiciones" element={<LegalPage />} />
          <Route path="libro-reclamaciones" element={<LibroReclamacionesPage />} />
          <Route path="eliminar-cuenta" element={<EliminarCuentaPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
