import { lazy, Suspense } from 'react'
import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { CustomCursor } from './components/ui/CustomCursor'
import { EventPopup } from './components/ui/EventPopup'
import { ContentProvider } from './context/ContentContext'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PostDetail } from './pages/PostDetail'
import { GalleryPage } from './pages/GalleryPage'
import { SectionLandingPage } from './pages/SectionLandingPage'

import { AdminLayout } from './components/admin/AdminLayout'
import { AdminLogin } from './pages/AdminLogin'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { PublicForm } from './pages/PublicForm'
import { ShortLinkRedirect } from './pages/ShortLinkRedirect'

import { ToolProvider } from './context/ToolContext'
import { usePageTracker } from './hooks/usePageTracker'

// Lazy-loaded heavy modules
const PortalRoutes = lazy(() => import('./portal/PortalRoutes').then(m => ({ default: m.PortalRoutes })))
const Dashboard = lazy(() => import('./components/admin/Dashboard').then(m => ({ default: m.Dashboard })))
const SectionManager = lazy(() => import('./components/admin/SectionManager').then(m => ({ default: m.SectionManager })))
const PostEditor = lazy(() => import('./components/admin/PostEditor').then(m => ({ default: m.PostEditor })))
const SubsectionEditor = lazy(() => import('./components/admin/SubsectionEditor').then(m => ({ default: m.SubsectionEditor })))
const AdminSections = lazy(() => import('./components/admin/AdminSections').then(m => ({ default: m.AdminSections })))
const PopupManager = lazy(() => import('./components/admin/PopupManager').then(m => ({ default: m.PopupManager })))
const GalleryEditor = lazy(() => import('./components/admin/GalleryEditor').then(m => ({ default: m.GalleryEditor })))
const AdminGarbageCollector = lazy(() => import('./components/admin/AdminGarbageCollector').then(m => ({ default: m.AdminGarbageCollector })))
const AdminAnalytics = lazy(() => import('./components/admin/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })))
const FormList = lazy(() => import('./components/admin/FormList').then(m => ({ default: m.FormList })))
const FormBuilder = lazy(() => import('./components/admin/FormBuilder').then(m => ({ default: m.FormBuilder })))
const FormResponseViewer = lazy(() => import('./components/admin/FormResponseViewer').then(m => ({ default: m.FormResponseViewer })))
const FormResponseDetail = lazy(() => import('./components/admin/FormResponseDetail').then(m => ({ default: m.FormResponseDetail })))
const GarbageCollector = lazy(() => import('./components/admin/GarbageCollector').then(m => ({ default: m.GarbageCollector })))
const AdminIssues = lazy(() => import('./components/admin/AdminIssues').then(m => ({ default: m.AdminIssues })))
const PosterEditor = lazy(() => import('./components/admin/PosterEditor').then(m => ({ default: m.PosterEditor })))
const UtilitiesPage = lazy(() => import('./pages/UtilitiesPage').then(m => ({ default: m.UtilitiesPage })))
const FrameToolPage = lazy(() => import('./pages/FrameToolPage').then(m => ({ default: m.FrameToolPage })))
const PosterToolPage = lazy(() => import('./pages/PosterToolPage').then(m => ({ default: m.PosterToolPage })))
const FilterToolPage = lazy(() => import('./pages/FilterToolPage').then(m => ({ default: m.FilterToolPage })))

function PageTracker() {
  usePageTracker()
  return null
}

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <div className="portal-spinner" />
    </div>
  )
}

const SectionRoute = ({ sectionType }: { sectionType: 'about' | 'initiatives' | 'media' | 'leadership' | 'resources' | 'dynamic' }) => {
  const location = useLocation()
  if (location.pathname.endsWith('/gallery')) {
    return <GalleryPage />
  }
  return <PostDetail sectionType={sectionType} />
}

function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <ToolProvider>
          <PageTracker />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* ═══ Member Management Portal ═══ */}
              <Route path="/portal/*" element={<PortalRoutes />} />

              {/* Admin Routes - NOT wrapped in Layout */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="sections" element={<AdminSections />} />
                  <Route path="popup" element={<PopupManager />} />
                  <Route path="garbage" element={<AdminGarbageCollector />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="section/:sectionId" element={<SectionManager />} />
                  <Route path="create/:sectionId" element={<PostEditor />} />
                  <Route path="create-post/:sectionId" element={<PostEditor />} />
                  <Route path="create-subsection/:sectionId" element={<SubsectionEditor />} />
                  <Route path="create-gallery/:sectionId" element={<GalleryEditor />} />
                  <Route path="create-poster/:sectionId" element={<PosterEditor />} />
                  <Route path="poster-editor/:id" element={<PosterEditor />} />
                  <Route path="post/:id" element={<PostEditor />} />
                  <Route path="subsection/:id" element={<SubsectionEditor />} />
                  <Route path="gallery-editor/:id" element={<GalleryEditor />} />
                  <Route path="forms" element={<FormList />} />
                  <Route path="forms/new" element={<FormBuilder />} />
                  <Route path="forms/:id" element={<FormBuilder />} />
                  <Route path="forms/:formId/responses" element={<FormResponseViewer />} />
                  <Route path="forms/:formId/responses/:responseId" element={<FormResponseDetail />} />
                  <Route path="garbage" element={<GarbageCollector />} />
                  <Route path="issues" element={<AdminIssues />} />
                </Route>
              </Route>

              {/* Public Form Route - outside admin, no main layout */}
              <Route path="/f/:formId" element={<PublicForm />} />

              {/* Short Link Redirect */}
              <Route path="/s/:shortCode" element={<ShortLinkRedirect />} />

              {/* Filter Tool - outside Layout to hide top navbar */}
              <Route path="/utilities/filter-tool" element={<FilterToolPage />} />
              <Route path="/utilities/frame-tool" element={<FrameToolPage />} />
              <Route path="/utilities/poster-tool" element={<PosterToolPage />} />
              {/* <Route path="/utilities" element={<UtilitiesPage />} /> */}

              {/* Main Site Routes - wildcard catch-all wrapped in Layout */}
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about-us/*" element={<SectionRoute sectionType="about" />} />
                    <Route path="/initiative/*" element={<SectionRoute sectionType="initiatives" />} />

                    {/* Explicit Route for /media Section Landing Page to avoid collision with /media/* wildcard */}
                    <Route path="/media" element={<SectionLandingPage sectionIdOverride="media" />} />
                    <Route path="/media/*" element={<SectionRoute sectionType="media" />} />
                    <Route path="/leader/*" element={<SectionRoute sectionType="leadership" />} />
                    <Route path="/resource/*" element={<SectionRoute sectionType="resources" />} />

                    {/* Dynamic Sections Route */}
                    <Route path="/section/:sectionId/:slug/*" element={<SectionRoute sectionType="dynamic" />} />

                    {/* Section Landing Pages (e.g., /jac, /about, /media) */}
                    <Route path="/:sectionId" element={<SectionLandingPage />} />

                    {/* Public Utilities */}
                    <Route path="/utilities" element={<UtilitiesPage />} />
                    <Route path="/utilities/frame-tool" element={<FrameToolPage />} />
                    <Route path="/utilities/poster-tool" element={<PosterToolPage />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </Suspense>
          <CustomCursor />
          <EventPopup />
        </ToolProvider>
      </ContentProvider>
    </ThemeProvider>
  )
}

export default App
