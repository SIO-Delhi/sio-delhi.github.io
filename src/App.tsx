import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { CustomCursor } from './components/ui/CustomCursor'
import { SplashScreen } from './components/ui/SplashScreen'
import { ContentProvider } from './context/ContentContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PostDetail } from './pages/PostDetail'
import { SubsectionDetail } from './pages/SubsectionDetail'
import { AdminLayout } from './components/admin/AdminLayout'
import { Dashboard } from './components/admin/Dashboard'
import { SectionManager } from './components/admin/SectionManager'
import { PostEditor } from './components/admin/PostEditor'
import { SubsectionEditor } from './components/admin/SubsectionEditor'
import { AdminLogin } from './pages/AdminLogin'
import { ProtectedRoute } from './components/admin/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Routes>
          {/* Main Site Routes - wrapped in Layout */}
          <Route element={<Layout><HomePage /></Layout>} path="/" />

          {/* Subsection detail page (shows child posts) */}
          <Route element={<Layout><SubsectionDetail /></Layout>} path="/subsection/:id" />

          {/* Section-specific post detail pages */}
          <Route element={<Layout><PostDetail sectionType="about" /></Layout>} path="/about-us/:id" />
          <Route element={<Layout><PostDetail sectionType="initiatives" /></Layout>} path="/initiative/:id" />
          <Route element={<Layout><PostDetail sectionType="media" /></Layout>} path="/media/:id" />
          <Route element={<Layout><PostDetail sectionType="leadership" /></Layout>} path="/leader/:id" />

          {/* Admin Routes - NOT wrapped in Layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="section/:sectionId" element={<SectionManager />} />
              <Route path="create/:sectionId" element={<PostEditor />} />
              <Route path="create-post/:sectionId" element={<PostEditor />} />
              <Route path="create-subsection/:sectionId" element={<SubsectionEditor />} />
              <Route path="post/:id" element={<PostEditor />} />
              <Route path="subsection/:id" element={<SubsectionEditor />} />
            </Route>
          </Route>
        </Routes>
        <CustomCursor />
        <SplashScreen />
      </ContentProvider>
    </ThemeProvider>
  )
}

export default App
