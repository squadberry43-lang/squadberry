import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { ToastProvider } from './components/ui/Toast';
import { Seo } from './components/seo/Seo';
import { HomePage } from './pages/HomePage';
import { SquadBerryPreviewPage } from './pages/SquadBerryPreviewPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ServicesPage } from './pages/ServicesPage';
import { InternationalServicesPage } from './pages/InternationalServicesPage';
import { BrandMark } from './components/brand/BrandMark';
import { InstallExperience } from './components/pwa/InstallExperience';
import { NotFoundPage } from './pages/NotFoundPage';
import { LegalPage } from './pages/LegalPage';
import { PrivacyConsent } from './components/privacy/PrivacyConsent';
import { useLocale } from './context/LocaleContext';
const StaffWorkPage = lazy(() => import('./pages/StaffWorkPage').then((module) => ({ default: module.StaffWorkPage })));
const MarketingPage = lazy(() => import('./pages/MarketingPage').then((module) => ({ default: module.MarketingPage })));
const TicketsPage = lazy(() => import('./pages/TicketsPage').then((module) => ({ default: module.TicketsPage })));
const SupportInboxPage = lazy(() => import('./pages/SupportInboxPage').then((module) => ({ default: module.SupportInboxPage })));
const ClientTicketsPage = lazy(() => import('./pages/ClientTicketsPage').then((module) => ({ default: module.ClientTicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage').then((module) => ({ default: module.TicketDetailPage })));
const ClientTicketDetailPage = lazy(() => import('./pages/ClientTicketDetailPage').then((module) => ({ default: module.ClientTicketDetailPage })));
const NewTicketPage = lazy(() => import('./pages/NewTicketPage').then((module) => ({ default: module.NewTicketPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const ClientAccountPage = lazy(() => import('./pages/ClientAccountPage').then((module) => ({ default: module.ClientAccountPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const VisitListPage = lazy(() => import('./pages/VisitPage').then((module) => ({ default: module.VisitListPage })));
const VisitPage = lazy(() => import('./pages/VisitPage').then((module) => ({ default: module.VisitPage })));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage').then((module) => ({ default: module.BudgetsPage })));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then((module) => ({ default: module.PaymentsPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then((module) => ({ default: module.ClientsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((module) => ({ default: module.InventoryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const RepairsPage = lazy(() => import('./pages/RepairsPage').then((module) => ({ default: module.RepairsPage })));
const ProspectsPage = lazy(() => import('./pages/ProspectsPage').then((module) => ({ default: module.ProspectsPage })));

export default function App() {
  const { t, locale } = useLocale();
  const location = useLocation();
  const services = locale === 'nl-NL' || locale === 'en-US' ? <InternationalServicesPage /> : <ServicesPage />;
  const { user, loading } = useAuth();
  const isAdmin = user?.role_name === 'admin' || user?.role_id === 'role_admin';
  const isMarketing = user?.role_name === 'marketing' || user?.role_id === 'role_marketing';
  const canManageOperations = isAdmin || user?.role_name === 'supervisor' || user?.role_id === 'role_supervisor';
  const canUseProspects = isAdmin || isMarketing;
  const isStaff = isAdmin || canManageOperations || isMarketing || user?.role_name === 'technician' || user?.role_id === 'role_technician';
  const canManageTechnicalWork = canManageOperations || user?.role_name === 'technician' || user?.role_id === 'role_technician';
  const isClient = user?.role_name === 'particular' || user?.role_name === 'enterprise' || user?.role_id === 'role_particular' || user?.role_id === 'role_enterprise';
  const isSquadBerryPreview = location.pathname === '/squadberry';

  if (loading) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <BrandMark compact className="mb-4 justify-center animate-pulse" />
          <p className="text-zinc-500 text-sm">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Seo />
      {!isSquadBerryPreview && <Header />}
      <main className={isSquadBerryPreview ? 'min-h-screen bg-[#050D21]' : 'min-h-screen bg-zinc-50 pb-20 md:pb-0'}>
        <Suspense fallback={<p className="py-16 text-center text-sm text-zinc-500">{t('app.loading')}</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/squadberry" element={<SquadBerryPreviewPage />} />
          {['ar', 'cl', 'es', 'nl', 'us'].map((region) => <Route key={region} path={`/${region}`} element={<HomePage />} />)}
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/services" element={services} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          {['ar', 'cl', 'es', 'nl', 'us'].map((region) => <Route key={`${region}-services`} path={`/${region}/services`} element={services} />)}
          <Route path="/dashboard" element={isAdmin ? <AdminDashboardPage /> : canManageOperations ? <DashboardPage /> : <Navigate to="/" replace />} />
          <Route path="/tickets" element={user ? (isClient ? <ClientTicketsPage /> : <TicketsPage />) : <Navigate to="/login" replace />} />
          <Route path="/mensajes" element={canManageTechnicalWork ? <SupportInboxPage /> : <Navigate to="/" replace />} />
          <Route path="/tickets/new" element={user ? <NewTicketPage /> : <Navigate to="/login" replace />} />
          <Route path="/tickets/:id" element={user ? (isClient ? <ClientTicketDetailPage /> : <TicketDetailPage />) : <Navigate to="/login" replace />} />
          <Route path="/visits" element={canManageTechnicalWork ? <VisitListPage /> : <Navigate to="/" replace />} />
          <Route path="/visits/:id" element={canManageTechnicalWork ? <VisitPage /> : <Navigate to="/" replace />} />
          <Route path="/agenda" element={isStaff ? <StaffWorkPage /> : <Navigate to="/" replace />} />
          <Route path="/equipo" element={canManageOperations ? <StaffWorkPage team /> : <Navigate to="/" replace />} />
          <Route path="/budgets" element={canManageOperations ? <BudgetsPage /> : <Navigate to="/" replace />} />
          <Route path="/invoices" element={canManageOperations ? <InvoicesPage /> : <Navigate to="/" replace />} />
          <Route path="/payments" element={canManageOperations ? <PaymentsPage /> : <Navigate to="/" replace />} />
          <Route path="/clients" element={canManageOperations ? <ClientsPage /> : <Navigate to="/" replace />} />
          <Route path="/inventory" element={canManageTechnicalWork ? <InventoryPage /> : <Navigate to="/" replace />} />
          <Route path="/enterprises" element={canManageOperations ? <ClientsPage /> : <Navigate to="/" replace />} />
          <Route path="/users" element={isAdmin ? <ClientsPage /> : <Navigate to="/" replace />} />
          <Route path="/providers" element={canManageTechnicalWork ? <Navigate to="/inventory" replace /> : <Navigate to="/" replace />} />
          <Route path="/settings" element={user ? (isClient ? <ClientAccountPage /> : <SettingsPage />) : <Navigate to="/login" replace />} />
          <Route path="/repairs" element={canManageTechnicalWork ? <RepairsPage /> : <Navigate to="/" replace />} />
          <Route path="/buscador-clientes" element={canUseProspects ? <ProspectsPage /> : <Navigate to="/" replace />} />
          <Route path="/prospects" element={canUseProspects ? <ProspectsPage /> : <Navigate to="/" replace />} />
          <Route path="/marketing" element={canUseProspects ? <MarketingPage /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={user ? (isClient ? <ClientAccountPage /> : <ProfilePage />) : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </main>
      {!isSquadBerryPreview && <InstallExperience />}
      {!isSquadBerryPreview && <footer className="border-t border-black/10 bg-white px-6 py-6 text-sm text-[#5f6368]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4">
          <span>Doctor Tech · Drtech.world</span>
          <nav className="flex flex-wrap items-center gap-5" aria-label={t('ui.legalNavigation')}>
            <Link className="hover:text-[#202124]" to="/privacy">{t('footer.privacy')}</Link>
            <Link className="hover:text-[#202124]" to="/terms">{t('footer.terms')}</Link>
            <PrivacyConsent />
          </nav>
        </div>
      </footer>}
    </ToastProvider>
  );
}
