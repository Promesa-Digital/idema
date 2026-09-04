import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/admin/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

function RedirectToProgramaSlug() {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/programas-de-estudio/${slug}`} replace />
}

function AdminRoutes() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/home/Home'))
const ProgramDetailPage = lazy(() => import('./pages/programs/ProgramDetailPage'))
const CursoDetailPage = lazy(() => import('./pages/programs/CursoDetailPage'))
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'))
const TransparenciaPage = lazy(() => import('./pages/legal/TransparenciaPage'))
const BienestarPage = lazy(() => import('./pages/BienestarPage'))
const BienestarServicioDetailPage = lazy(() => import('./pages/BienestarServicioDetailPage'))
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
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const ProgramasAdminPage = lazy(() => import('./pages/admin/ProgramasAdminPage'))
const PopupsAdminPage = lazy(() => import('./pages/admin/PopupsAdminPage'))
const CombosAdminPage = lazy(() => import('./pages/admin/CombosAdminPage'))
const DescuentosAdminPage = lazy(() => import('./pages/admin/DescuentosAdminPage'))
const OrdenesAdminPage = lazy(() => import('./pages/admin/OrdenesAdminPage'))
const ComprobantesAdminPage = lazy(() => import('./pages/admin/ComprobantesAdminPage'))
const LeadsAdminPage = lazy(() => import('./pages/admin/LeadsAdminPage'))
const UsuariosAdminPage = lazy(() => import('./pages/admin/UsuariosAdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* Oferta educativa */}
          <Route path="programas-de-estudio" element={<ProgramasPage />} />
          <Route path="carreras" element={<Navigate to="/programas-de-estudio" replace />} />
          <Route path="programas" element={<Navigate to="/programas-de-estudio" replace />} />
          {/* Detalle de programas */}
          <Route path="programas-de-estudio/:slug" element={<ProgramDetailPage />} />
          <Route path="carreras/:slug" element={<RedirectToProgramaSlug />} />
          <Route path="auxiliares/:slug" element={<ProgramDetailPage />} />
          <Route path="especializaciones/:slug" element={<ProgramDetailPage />} />
          <Route path="cursos/:slug" element={<CursoDetailPage />} />
          {/* Servicios */}
          <Route path="servicios/:slug" element={<ServicioPage />} />
          {/* Institucional */}
          <Route path="nosotros" element={<NosotrosPage />} />
          <Route path="transparencia" element={<TransparenciaPage />} />
          <Route path="bienestar" element={<BienestarPage />} />
          <Route path="bienestar/:slug" element={<BienestarServicioDetailPage />} />
          <Route path="cursos-gratis" element={<CursosGratisPage />} />
          <Route path="idema-educa" element={<Navigate to="/programas-de-estudio" replace />} />
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
        <Route path="/admin" element={<AdminRoutes />}>
          <Route path="login" element={<LoginPage />} />
          <Route
            path="programas"
            element={
              <ProtectedRoute>
                <ProgramasAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="popups"
            element={
              <ProtectedRoute
                allowedRoles={['marketing', 'director_marketing', 'admin_sistema']}
              >
                <PopupsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="combos"
            element={
              <ProtectedRoute allowedRoles={['ventas', 'marketing', 'admin_sistema']}>
                <CombosAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="descuentos"
            element={
              <ProtectedRoute allowedRoles={['ventas', 'admin_sistema']}>
                <DescuentosAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="ordenes"
            element={
              <ProtectedRoute allowedRoles={['administracion', 'admin_sistema']}>
                <OrdenesAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="comprobantes"
            element={
              <ProtectedRoute allowedRoles={['administracion', 'admin_sistema']}>
                <ComprobantesAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="leads"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'marketing',
                  'director_marketing',
                  'ventas',
                  'administracion',
                  'admin_sistema',
                ]}
              >
                <LeadsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute allowedRoles={['admin_sistema']}>
                <UsuariosAdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
