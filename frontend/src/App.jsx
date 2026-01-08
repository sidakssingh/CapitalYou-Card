import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DataUploadPage from './pages/DataUploadPage'
import ManageUploadsPage from './pages/ManageUploadsPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard/:userId?" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <DataUploadPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/manage" 
        element={
          <ProtectedRoute>
            <ManageUploadsPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App
