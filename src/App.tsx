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
import { FrameTool } from './components/admin/FrameTool'
import { Utilities } from './components/admin/Utilities'
import { AdminGarbageCollector } from './components/admin/AdminGarbageCollector'
import { FormList } from './components/admin/FormList'
import { FormBuilder } from './components/admin/FormBuilder'
import { FormResponseViewer } from './components/admin/FormResponseViewer'
import { FormResponseDetail } from './components/admin/FormResponseDetail'
import { GarbageCollector } from './components/admin/GarbageCollector'
import { PublicForm } from './pages/PublicForm'


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
              <Route path="utilities" element={<Utilities />} />
              <Route path="utilities/frame-tool" element={<FrameTool />} />
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
