import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { CustomCursor } from './components/ui/CustomCursor'
import { SplashScreen } from './components/ui/SplashScreen'
import { ContentProvider } from './context/ContentContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { PostDetail } from './pages/PostDetail'

import { AdminLayout } from './components/admin/AdminLayout'
import { Dashboard } from './components/admin/Dashboard'
import { SectionManager } from './components/admin/SectionManager'
import { PostEditor } from './components/admin/PostEditor'
import { SubsectionEditor } from './components/admin/SubsectionEditor'
import { AdminSections } from './components/admin/AdminSections'
import { AdminLogin } from './pages/AdminLogin'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { AdminGarbageCollector } from './components/admin/AdminGarbageCollector'

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
              <Route path="cleaner" element={<AdminGarbageCollector />} />
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
                <Route path="/initiative/:id" element={<PostDetail sectionType="initiatives" />} />
                <Route path="/media/:id" element={<PostDetail sectionType="media" />} />
                <Route path="/leader/:id" element={<PostDetail sectionType="leadership" />} />
                <Route path="/resource/:id" element={<PostDetail sectionType="resources" />} />
                {/* Dynamic Sections Route */}
                <Route path="/section/:sectionId/:id" element={<PostDetail sectionType="dynamic" />} />
              </Routes>
            </Layout>
          } />
        </Routes>
        <CustomCursor />
        <SplashScreen />
      </ContentProvider>
    </ThemeProvider>
  )
}

export default App
