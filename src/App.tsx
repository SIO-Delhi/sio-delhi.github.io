import { Layout } from './components/layout/Layout'
import { ThemeProvider } from './context/ThemeContext'
import { CustomCursor } from './components/ui/CustomCursor'
import { SplashScreen } from './components/ui/SplashScreen'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { InitiativeDetail } from './pages/InitiativeDetail'

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/initiative/:id" element={<InitiativeDetail />} />
        </Routes>
      </Layout>
      <CustomCursor />
      <SplashScreen />
    </ThemeProvider>
  )
}

export default App
