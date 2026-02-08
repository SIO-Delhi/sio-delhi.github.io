import './portal.css'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { PortalAuthProvider, usePortalAuth } from './context/PortalAuthContext'
import { PortalLayout } from './components/PortalLayout'
import { ROLE_DASHBOARD_PATHS } from './constants'
import type { PortalRole } from './types'

// Pages
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ManagePage } from './pages/ManagePage'
import { BulkAddPage } from './pages/BulkAddPage'
import { TitlesPage } from './pages/TitlesPage'
import { MessagesComposePage } from './pages/MessagesComposePage'
import { MessagesInboxPage } from './pages/MessagesInboxPage'
import { PerformancePage } from './pages/PerformancePage'
import { PerfFormBuilderPage } from './pages/PerfFormBuilderPage'
import { PerfFormFillPage } from './pages/PerfFormFillPage'
import { PerfResponsesPage } from './pages/PerfResponsesPage'
import { MigrationsPage } from './pages/MigrationsPage'
import { MemberProfilePage } from './pages/MemberProfilePage'
import { ViewMemberPage } from './pages/ViewMemberPage'
import { ViewUnitPage } from './pages/ViewUnitPage'
import { ViewCirclePage } from './pages/ViewCirclePage'
import { ViewCampusPage } from './pages/ViewCampusPage'
import { UnitsWithoutPresidentPage } from './pages/UnitsWithoutPresidentPage'
import { RegionsPage } from './pages/RegionsPage'
import { MemberAccountPage } from './pages/MemberAccountPage'
import { PortalLogoutPage } from './pages/PortalLogoutPage'

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
    <PortalAuthProvider>
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
                <Route path="admin/campuses/add" element={<BulkAddPage entity="campuses" />} />
                <Route path="admin/campuses/manage" element={<ManagePage entity="campuses" />} />
                <Route path="admin/campuses/:campusId" element={<ViewCampusPage />} />
                <Route path="admin/regions" element={<RegionsPage />} />
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
                <Route path="unit/members" element={<ManagePage entity="members" readOnly />} />
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
    </PortalAuthProvider>
  )
}
