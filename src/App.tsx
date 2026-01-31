import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { CustomCursor } from './components/ui/CustomCursor'
import { SplashScreen } from './components/ui/SplashScreen'
import { EventPopup } from './components/ui/EventPopup'
import { ContentProvider } from './context/ContentContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PostDetail } from './pages/PostDetail'
import { GalleryPage } from './pages/GalleryPage'

import { AdminLayout } from './components/admin/AdminLayout'
import { Dashboard } from './components/admin/Dashboard'
import { SectionManager } from './components/admin/SectionManager'
import { PostEditor } from './components/admin/PostEditor'
import { SubsectionEditor } from './components/admin/SubsectionEditor'
import { AdminSections } from './components/admin/AdminSections'
import { AdminLogin } from './pages/AdminLogin'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { PopupManager } from './components/admin/PopupManager'
import { GalleryEditor } from './components/admin/GalleryEditor'
import { AdminGarbageCollector } from './components/admin/AdminGarbageCollector'
import { FormList } from './components/admin/FormList'
import { FormBuilder } from './components/admin/FormBuilder'
import { FormResponseViewer } from './components/admin/FormResponseViewer'
import { FormResponseDetail } from './components/admin/FormResponseDetail'
import { GarbageCollector } from './components/admin/GarbageCollector'
import { PublicForm } from './pages/PublicForm'
import { UtilitiesPage } from './pages/UtilitiesPage'
import { FrameToolPage } from './pages/FrameToolPage'
import { PosterToolPage } from './pages/PosterToolPage'
import { FilterToolPage } from './pages/FilterToolPage'


import { ToolProvider } from './context/ToolContext'

function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <ToolProvider>
          <Routes>
            {/* Admin Routes - NOT wrapped in Layout */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sections" element={<AdminSections />} />
                <Route path="popup" element={<PopupManager />} />
                <Route path="garbage" element={<AdminGarbageCollector />} />
                <Route path="section/:sectionId" element={<SectionManager />} />
                <Route path="create/:sectionId" element={<PostEditor />} />
                <Route path="create-post/:sectionId" element={<PostEditor />} />
                <Route path="create-subsection/:sectionId" element={<SubsectionEditor />} />
                <Route path="create-gallery/:sectionId" element={<GalleryEditor />} />
                <Route path="post/:id" element={<PostEditor />} />
                <Route path="subsection/:id" element={<SubsectionEditor />} />
                <Route path="gallery-editor/:id" element={<GalleryEditor />} />
                <Route path="forms" element={<FormList />} />
                <Route path="forms/new" element={<FormBuilder />} />
                <Route path="forms/:id" element={<FormBuilder />} />
                <Route path="forms/:formId/responses" element={<FormResponseViewer />} />
                <Route path="forms/:formId/responses/:responseId" element={<FormResponseDetail />} />
                <Route path="garbage" element={<GarbageCollector />} />
              </Route>
            </Route>

            {/* Public Form Route - outside admin, no main layout */}
            <Route path="/f/:formId" element={<PublicForm />} />

            {/* Filter Tool - outside Layout to hide top navbar */}
            <Route path="/utilities/filter-tool" element={<FilterToolPage />} />
            <Route path="/utilities/frame-tool" element={<FrameToolPage />} />
            <Route path="/utilities/poster-tool" element={<PosterToolPage />} />
            <Route path="/utilities" element={<UtilitiesPage />} />

            {/* Main Site Routes - wildcard catch-all wrapped in Layout */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about-us/:slug" element={<PostDetail sectionType="about" />} />
                  <Route path="/about-us/:slug/gallery" element={<GalleryPage />} />
                  <Route path="/initiative/:slug" element={<PostDetail sectionType="initiatives" />} />
                  <Route path="/initiative/:slug/gallery" element={<GalleryPage />} />
                  <Route path="/media/:slug" element={<PostDetail sectionType="media" />} />
                  <Route path="/media/:slug/gallery" element={<GalleryPage />} />
                  <Route path="/leader/:slug" element={<PostDetail sectionType="leadership" />} />
                  <Route path="/leader/:slug/gallery" element={<GalleryPage />} />
                  <Route path="/resource/:slug" element={<PostDetail sectionType="resources" />} />
                  <Route path="/resource/:slug/gallery" element={<GalleryPage />} />
                  {/* Dynamic Sections Route */}
                  <Route path="/section/:sectionId/:slug" element={<PostDetail sectionType="dynamic" />} />
                  <Route path="/section/:sectionId/:slug/gallery" element={<GalleryPage />} />

                  {/* Public Utilities */}
                  <Route path="/utilities" element={<UtilitiesPage />} />
                  <Route path="/utilities/frame-tool" element={<FrameToolPage />} />
                  <Route path="/utilities/poster-tool" element={<PosterToolPage />} />
                </Routes>
              </Layout>
            } />
          </Routes>
          <CustomCursor />
          <SplashScreen />
          <EventPopup />
        </ToolProvider>
      </ContentProvider>
    </ThemeProvider>
  )
}

export default App
