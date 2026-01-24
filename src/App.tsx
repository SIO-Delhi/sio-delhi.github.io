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

function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Routes>
          {/* Admin Routes - NOT wrapped in Layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sections" element={<AdminSections />} />
              <Route path="popup" element={<PopupManager />} />
              <Route path="section/:sectionId" element={<SectionManager />} />
              <Route path="create/:sectionId" element={<PostEditor />} />
              <Route path="create-post/:sectionId" element={<PostEditor />} />
              <Route path="create-subsection/:sectionId" element={<SubsectionEditor />} />
              <Route path="post/:id" element={<PostEditor />} />
              <Route path="subsection/:id" element={<SubsectionEditor />} />
            </Route>
          </Route>

          {/* Main Site Routes - wildcard catch-all wrapped in Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about-us/:id" element={<PostDetail sectionType="about" />} />
                <Route path="/about-us/:id/gallery" element={<GalleryPage />} />
                <Route path="/initiative/:id" element={<PostDetail sectionType="initiatives" />} />
                <Route path="/initiative/:id/gallery" element={<GalleryPage />} />
                <Route path="/media/:id" element={<PostDetail sectionType="media" />} />
                <Route path="/media/:id/gallery" element={<GalleryPage />} />
                <Route path="/leader/:id" element={<PostDetail sectionType="leadership" />} />
                <Route path="/leader/:id/gallery" element={<GalleryPage />} />
                <Route path="/resource/:id" element={<PostDetail sectionType="resources" />} />
                <Route path="/resource/:id/gallery" element={<GalleryPage />} />
                {/* Dynamic Sections Route */}
                <Route path="/section/:sectionId/:id" element={<PostDetail sectionType="dynamic" />} />
                <Route path="/section/:sectionId/:id/gallery" element={<GalleryPage />} />
              </Routes>
            </Layout>
          } />
        </Routes>
        <CustomCursor />
        <SplashScreen />
        <EventPopup />
      </ContentProvider>
    </ThemeProvider>
  )
}

export default App
