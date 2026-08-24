import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import AdminLayout from './components/layout/AdminLayout'
import PortalLayout from './components/layout/PortalLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import PrivateRoute from './components/auth/PrivateRoute'
import type { UserRole } from './types/auth'

/** Cualquier rol no-alumno puede entrar al shell de /admin; qué ve en el sidebar
 * y a qué secciones concretas tiene acceso ya lo decide cada guard más específico. */
const ROLES_STAFF: UserRole[] = [
  'admin_sistema',
  'academico',
  'marketing',
  'director_marketing',
  'ventas',
  'administracion',
]

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/home/Home'))
const ProgramDetailPage = lazy(() => import('./pages/programs/ProgramDetailPage'))
const CursoDetailPage = lazy(() => import('./pages/programs/CursoDetailPage'))
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'))
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const DashboardPage = lazy(() => import('./pages/portal/DashboardPage'))
const MatriculasPage = lazy(() => import('./pages/portal/MatriculasPage'))
const CheckoutPage = lazy(() => import('./pages/portal/CheckoutPage'))
const ElectivosPage = lazy(() => import('./pages/portal/ElectivosPage'))
const PagosPage = lazy(() => import('./pages/portal/PagosPage'))
const ComprobantesPage = lazy(() => import('./pages/portal/ComprobantesPage'))
const MiCuentaPage = lazy(() => import('./pages/portal/MiCuentaPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ProgramasAdminPage = lazy(() => import('./pages/admin/ProgramasAdminPage'))
const ProgramaNuevoPage = lazy(() => import('./pages/admin/ProgramaNuevoPage'))
const ProgramaEditarPage = lazy(() => import('./pages/admin/ProgramaEditarPage'))
const PopupsAdminPage = lazy(() => import('./pages/admin/PopupsAdminPage'))
const PopupNuevoPage = lazy(() => import('./pages/admin/PopupNuevoPage'))
const PopupEditarPage = lazy(() => import('./pages/admin/PopupEditarPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* Oferta educativa */}
          <Route path="carreras" element={<ProgramasPage />} />
          <Route path="programas" element={<Navigate to="/carreras" replace />} />
          {/* Detalle de programas */}
          <Route path="carreras/:slug" element={<ProgramDetailPage />} />
          <Route path="auxiliares/:slug" element={<ProgramDetailPage />} />
          <Route path="especializaciones/:slug" element={<ProgramDetailPage />} />
          <Route path="cursos/:slug" element={<CursoDetailPage />} />
          {/* Servicios */}
          <Route path="servicios/:slug" element={<ServicioPage />} />
          {/* Institucional */}
          <Route path="nosotros" element={<NosotrosPage />} />
          <Route path="bienestar" element={<BienestarPage />} />
          <Route path="bienestar/:slug" element={<BienestarServicioDetailPage />} />
          <Route path="cursos-gratis" element={<CursosGratisPage />} />
          <Route path="idema-educa" element={<Navigate to="/carreras" replace />} />
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
          {/* Auth */}
          <Route path="login" element={<LoginPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Portal del alumno: shell propio (PortalLayout), sin navbar/footer público */}
        <Route element={<PrivateRoute allowedRoles={['alumno']} />}>
          <Route element={<PortalLayout />}>
            <Route path="portal" element={<DashboardPage />} />
            <Route path="portal/matriculas" element={<MatriculasPage />} />
            <Route path="portal/checkout" element={<CheckoutPage />} />
            <Route path="portal/electivos" element={<ElectivosPage />} />
            <Route path="portal/pagos" element={<PagosPage />} />
            <Route path="portal/comprobantes" element={<ComprobantesPage />} />
            <Route path="portal/mi-cuenta" element={<MiCuentaPage />} />
          </Route>
        </Route>

        {/* Panel admin: shell propio (AdminLayout), sin navbar/footer público */}
        <Route element={<PrivateRoute allowedRoles={ROLES_STAFF} />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<AdminPage />} />
            <Route element={<PrivateRoute allowedRoles={['academico', 'admin_sistema']} />}>
              <Route path="admin/programas" element={<ProgramasAdminPage />} />
              <Route path="admin/programas/nuevo" element={<ProgramaNuevoPage />} />
              <Route path="admin/programas/:id/editar" element={<ProgramaEditarPage />} />
            </Route>
            <Route element={<PrivateRoute allowedRoles={['marketing', 'director_marketing', 'admin_sistema']} />}>
              <Route path="admin/popups" element={<PopupsAdminPage />} />
              <Route path="admin/popups/nuevo" element={<PopupNuevoPage />} />
              <Route path="admin/popups/:id/editar" element={<PopupEditarPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
