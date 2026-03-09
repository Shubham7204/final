import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import MyBookings from './pages/MyBookings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminResources from './pages/admin/AdminResources'
import AdminUsers from './pages/admin/AdminUsers'

function AppRoutes() {
  const { user } = useAuth()
  const defaultRedirect = user ? (user.role === 'Admin' ? '/admin' : '/dashboard') : '/'

  return (
    <>
      <Navbar />
      <Routes>
        {/* Landing – always public, no Navbar overlay */}
        <Route path="/" element={<Landing />} />

        {/* Public auth pages */}
        <Route path="/login" element={user ? <Navigate to={defaultRedirect} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={defaultRedirect} replace /> : <Register />} />

        {/* Employee */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute adminOnly={true}><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/resources" element={<ProtectedRoute adminOnly={true}><AdminResources /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
