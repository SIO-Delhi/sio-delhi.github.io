import './portal.css'
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { PortalAuthProvider, usePortalAuth } from './context/PortalAuthContext'
import { PortalLayout } from './components/PortalLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ROLE_DASHBOARD_PATHS } from './constants'
import type { PortalRole } from './types'

// Lazy-loaded portal pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ManagePage = lazy(() => import('./pages/ManagePage').then(m => ({ default: m.ManagePage })))
const BulkAddPage = lazy(() => import('./pages/BulkAddPage').then(m => ({ default: m.BulkAddPage })))
const TitlesPage = lazy(() => import('./pages/TitlesPage').then(m => ({ default: m.TitlesPage })))
const MessagesComposePage = lazy(() => import('./pages/MessagesComposePage').then(m => ({ default: m.MessagesComposePage })))
const MessagesInboxPage = lazy(() => import('./pages/MessagesInboxPage').then(m => ({ default: m.MessagesInboxPage })))
const PerformancePage = lazy(() => import('./pages/PerformancePage').then(m => ({ default: m.PerformancePage })))
const PerfFormBuilderPage = lazy(() => import('./pages/PerfFormBuilderPage').then(m => ({ default: m.PerfFormBuilderPage })))
const PerfFormFillPage = lazy(() => import('./pages/PerfFormFillPage').then(m => ({ default: m.PerfFormFillPage })))
const PerfResponsesPage = lazy(() => import('./pages/PerfResponsesPage').then(m => ({ default: m.PerfResponsesPage })))
const MigrationsPage = lazy(() => import('./pages/MigrationsPage').then(m => ({ default: m.MigrationsPage })))
const MemberProfilePage = lazy(() => import('./pages/MemberProfilePage').then(m => ({ default: m.MemberProfilePage })))
const ViewMemberPage = lazy(() => import('./pages/ViewMemberPage').then(m => ({ default: m.ViewMemberPage })))
const ViewUnitPage = lazy(() => import('./pages/ViewUnitPage').then(m => ({ default: m.ViewUnitPage })))
const ViewCirclePage = lazy(() => import('./pages/ViewCirclePage').then(m => ({ default: m.ViewCirclePage })))
const ViewCampusPage = lazy(() => import('./pages/ViewCampusPage').then(m => ({ default: m.ViewCampusPage })))
const UnitsWithoutPresidentPage = lazy(() => import('./pages/UnitsWithoutPresidentPage').then(m => ({ default: m.UnitsWithoutPresidentPage })))
const RegionsPage = lazy(() => import('./pages/RegionsPage').then(m => ({ default: m.RegionsPage })))
const MemberAccountPage = lazy(() => import('./pages/MemberAccountPage').then(m => ({ default: m.MemberAccountPage })))
const EditRequestsPage = lazy(() => import('./pages/EditRequestsPage').then(m => ({ default: m.EditRequestsPage })))
const PortalLogoutPage = lazy(() => import('./pages/PortalLogoutPage').then(m => ({ default: m.PortalLogoutPage })))

function PortalLoadingFallback() {
  return (
    <div className="portal-app portal-fullscreen portal-fullscreen-col">
      <div className="portal-spinner" />
    </div>
  )
}

/* ── Clerk auth guard ── */

function RequireClerkAuth() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="portal-app portal-fullscreen portal-fullscreen-col">
        <div className="portal-spinner" />
      </div>
    )
  }

  if (!isSignedIn) return <Navigate to="/portal/login" replace />
  return <Outlet />
}

/* ── Portal user loaded guard ── */

function RequirePortalUser() {
  const { user, loading, error } = usePortalAuth()

  if (loading) {
    return (
      <div className="portal-app portal-fullscreen portal-fullscreen-col">
        <div className="portal-spinner" />
        <p className="portal-spinner-text">Loading portal data…</p>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="portal-app portal-fullscreen portal-fullscreen-col">
        <div className="portal-error-page">
          <p className="portal-error-title">Access Denied</p>
          <p className="portal-error-desc">
            {error ?? 'Your account is not registered in the portal. Contact your administrator.'}
          </p>
          <a href="/portal/logout" className="portal-error-link">Try again</a>
        </div>
      </div>
    )
  }

  return <Outlet />
}

/* ── Role guard ── */

function RoleGuard({ role }: { role: PortalRole }) {
  const { user } = usePortalAuth()
  if (!user) return <Navigate to="/portal/login" replace />
  if (user.role !== role) return <Navigate to={ROLE_DASHBOARD_PATHS[user.role]} replace />
  return <Outlet />
}

/* ── Portal root redirect ── */

function PortalIndex() {
  const { user, loading, isAuthenticated } = usePortalAuth()
  const { isSignedIn } = useAuth()

  if (loading) {
    return (
      <div className="portal-app portal-fullscreen portal-fullscreen-col">
        <div className="portal-spinner" />
        <p className="portal-spinner-text">Loading…</p>
      </div>
    )
  }
  if (isAuthenticated && user) return <Navigate to={ROLE_DASHBOARD_PATHS[user.role]} replace />
  if (isSignedIn && !user) {
    return (
      <div className="portal-app portal-fullscreen portal-fullscreen-col">
        <div className="portal-error-page">
          <p className="portal-error-title">Access Denied</p>
          <p className="portal-error-desc">Your account is not registered in the portal. Contact your administrator.</p>
          <a href="/portal/logout" className="portal-error-link">Try again</a>
        </div>
      </div>
    )
  }
  return <Navigate to="/portal/login" replace />
}

/* ── Main routes ── */

export function PortalRoutes() {
  return (
    <ErrorBoundary>
    <PortalAuthProvider>
      <Suspense fallback={<PortalLoadingFallback />}>
      <Routes>
        <Route index element={<PortalIndex />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="logout" element={<PortalLogoutPage />} />

        <Route element={<RequireClerkAuth />}>
          <Route element={<RequirePortalUser />}>
            <Route element={<PortalLayout />}>

              {/* Admin */}
              <Route element={<RoleGuard role="admin" />}>
                <Route path="admin/dashboard" element={<DashboardPage />} />
                <Route path="admin/units/add" element={<BulkAddPage entity="units" />} />
                <Route path="admin/units/manage" element={<ManagePage entity="units" />} />
                <Route path="admin/units/:unitId" element={<ViewUnitPage />} />
                <Route path="admin/circles/add" element={<BulkAddPage entity="circles" />} />
                <Route path="admin/circles/manage" element={<ManagePage entity="circles" />} />
                <Route path="admin/circles/:circleId" element={<ViewCirclePage />} />
                <Route path="admin/campuses/add" element={<BulkAddPage entity="campuses" />} />
                <Route path="admin/campuses/manage" element={<ManagePage entity="campuses" />} />
                <Route path="admin/campuses/:campusId" element={<ViewCampusPage />} />
                <Route path="admin/regions/add" element={<BulkAddPage entity="regions" />} />
                <Route path="admin/regions/manage" element={<ManagePage entity="regions" />} />
                <Route path="admin/regions" element={<Navigate to="/portal/admin/regions/manage" replace />} />
                <Route path="admin/zonal-secretaries/add" element={<BulkAddPage entity="zonal-secretaries" />} />
                <Route path="admin/zonal-secretaries/manage" element={<ManagePage entity="zonal-secretaries" />} />
                <Route path="admin/regional-presidents/add" element={<BulkAddPage entity="regional-presidents" />} />
                <Route path="admin/regional-presidents/manage" element={<ManagePage entity="regional-presidents" />} />
                <Route path="admin/unit-presidents/add" element={<BulkAddPage entity="unit-presidents" />} />
                <Route path="admin/unit-presidents/units-without-president" element={<UnitsWithoutPresidentPage />} />
                <Route path="admin/unit-presidents/manage" element={<ManagePage entity="unit-presidents" />} />
                <Route path="admin/campus-presidents/manage" element={<ManagePage entity="campus-presidents" />} />
                <Route path="admin/members/add" element={<BulkAddPage entity="members" />} />
                <Route path="admin/members/manage" element={<ManagePage entity="members" />} />
                <Route path="admin/members/:memberId" element={<ViewMemberPage />} />
                <Route path="admin/edit-requests" element={<EditRequestsPage />} />
                <Route path="admin/titles" element={<TitlesPage />} />
                <Route path="admin/migrations" element={<MigrationsPage />} />
                <Route path="admin/performance" element={<PerformancePage />} />
                <Route path="admin/performance/create" element={<PerfFormBuilderPage />} />
                <Route path="admin/performance/:formId/edit" element={<PerfFormBuilderPage />} />
                <Route path="admin/performance/:formId/fill" element={<PerfFormFillPage />} />
                <Route path="admin/performance/:formId/responses" element={<PerfResponsesPage />} />
                <Route path="admin/messages/compose" element={<MessagesComposePage />} />
                <Route path="admin/messages/inbox" element={<MessagesInboxPage />} />
              </Route>

              {/* Zonal Secretary */}
              <Route element={<RoleGuard role="zonal_secretary" />}>
                <Route path="zonal/dashboard" element={<DashboardPage />} />
                <Route path="zonal/units" element={<ManagePage entity="units" readOnly />} />
                <Route path="zonal/units/:unitId" element={<ViewUnitPage />} />
                <Route path="zonal/circles" element={<ManagePage entity="circles" readOnly />} />
                <Route path="zonal/circles/:circleId" element={<ViewCirclePage />} />
                <Route path="zonal/campuses" element={<ManagePage entity="campuses" readOnly />} />
                <Route path="zonal/campuses/:campusId" element={<ViewCampusPage />} />
                <Route path="zonal/regions" element={<RegionsPage />} />
                <Route path="zonal/regional-presidents" element={<ManagePage entity="regional-presidents" readOnly />} />
                <Route path="zonal/unit-presidents" element={<ManagePage entity="unit-presidents" readOnly />} />
                <Route path="zonal/campus-presidents" element={<ManagePage entity="campus-presidents" readOnly />} />
                <Route path="zonal/members" element={<ManagePage entity="members" readOnly />} />
                <Route path="zonal/members/:memberId" element={<ViewMemberPage />} />
                <Route path="zonal/titles" element={<TitlesPage />} />
                <Route path="zonal/performance" element={<PerformancePage />} />
                <Route path="zonal/performance/create" element={<PerfFormBuilderPage />} />
                <Route path="zonal/performance/:formId/edit" element={<PerfFormBuilderPage />} />
                <Route path="zonal/performance/:formId/fill" element={<PerfFormFillPage />} />
                <Route path="zonal/performance/:formId/responses" element={<PerfResponsesPage />} />
                <Route path="zonal/migrations" element={<MigrationsPage />} />
                <Route path="zonal/messages/compose" element={<MessagesComposePage />} />
                <Route path="zonal/messages/inbox" element={<MessagesInboxPage />} />
              </Route>

              {/* Regional President */}
              <Route element={<RoleGuard role="regional_president" />}>
                <Route path="regional/dashboard" element={<DashboardPage />} />
                <Route path="regional/units" element={<ManagePage entity="units" readOnly />} />
                <Route path="regional/units/:unitId" element={<ViewUnitPage />} />
                <Route path="regional/unit-presidents" element={<ManagePage entity="unit-presidents" readOnly />} />
                <Route path="regional/members" element={<ManagePage entity="members" readOnly />} />
                <Route path="regional/members/:memberId" element={<ViewMemberPage />} />
                <Route path="regional/performance" element={<PerformancePage />} />
                <Route path="regional/performance/create" element={<PerfFormBuilderPage />} />
                <Route path="regional/performance/:formId/edit" element={<PerfFormBuilderPage />} />
                <Route path="regional/performance/:formId/fill" element={<PerfFormFillPage />} />
                <Route path="regional/performance/:formId/responses" element={<PerfResponsesPage />} />
                <Route path="regional/migrations" element={<MigrationsPage />} />
                <Route path="regional/messages/compose" element={<MessagesComposePage />} />
                <Route path="regional/messages/inbox" element={<MessagesInboxPage />} />
              </Route>

              {/* Unit President */}
              <Route element={<RoleGuard role="unit_president" />}>
                <Route path="unit/dashboard" element={<DashboardPage />} />
                <Route path="unit/members" element={<ManagePage entity="members" />} />
                <Route path="unit/edit-requests" element={<EditRequestsPage />} />
                <Route path="unit/members/:memberId" element={<ViewMemberPage />} />
                <Route path="unit/titles" element={<TitlesPage />} />
                <Route path="unit/performance" element={<PerformancePage />} />
                <Route path="unit/performance/create" element={<PerfFormBuilderPage />} />
                <Route path="unit/performance/:formId/edit" element={<PerfFormBuilderPage />} />
                <Route path="unit/performance/:formId/fill" element={<PerfFormFillPage />} />
                <Route path="unit/performance/:formId/responses" element={<PerfResponsesPage />} />
                <Route path="unit/messages/compose" element={<MessagesComposePage />} />
                <Route path="unit/messages/inbox" element={<MessagesInboxPage />} />
              </Route>

              {/* Member */}
              <Route element={<RoleGuard role="member" />}>
                <Route path="member/dashboard" element={<DashboardPage />} />
                <Route path="member/profile" element={<MemberProfilePage />} />
                <Route path="member/account/*" element={<MemberAccountPage />} />
                <Route path="member/performance" element={<PerformancePage />} />
                <Route path="member/performance/:formId/fill" element={<PerfFormFillPage />} />
                <Route path="member/migrations" element={<MigrationsPage />} />
                <Route path="member/messages/compose" element={<MessagesComposePage />} />
                <Route path="member/messages/inbox" element={<MessagesInboxPage />} />
              </Route>

            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/portal/login" replace />} />
      </Routes>
      </Suspense>
    </PortalAuthProvider>
    </ErrorBoundary>
  )
}
