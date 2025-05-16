import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import VerifyEmail from './components/VerifyEmail'
import Dashboard from './pages/dashboard/Dashboard'
import PrintHub from './pages/printing/PrintHub'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import PrintJobManagement from './pages/admin/PrintJobManagement'
import PointsManagement from './pages/admin/PointsManagement'
import AdminSettings from './pages/admin/AdminSettings'
import AdminHistory from './pages/admin/AdminHistory'
import './App.css'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return children
}

// Admin route component - enhanced to check admin roles
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null
  const [loading, setLoading] = React.useState(true)
  const [isAdmin, setIsAdmin] = React.useState(false)
  
  React.useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'))
        
        // First check localStorage for cached user data
        if (userData && (userData.role === 'admin' || userData.role === 'master' || userData.isAdmin === true)) {
          setIsAdmin(true)
          setLoading(false)
          return
        }
        
        // If no cached data or not admin in cache, fetch from API
        const { authAPI } = await import('./utils/api')
        const currentUser = await authAPI.getCurrentUser()
        
        // Store user data in localStorage for future checks
        localStorage.setItem('user', JSON.stringify(currentUser))
        
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master' || currentUser.isAdmin === true)) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    
    if (isAuthenticated) {
      checkAdminStatus()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])
  
  if (loading) {
    // Show loading state while checking admin status
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

// Root redirect component to check user role and redirect accordingly
const RootRedirect = () => {
  const isAuthenticated = localStorage.getItem('token') !== null
  const [loading, setLoading] = React.useState(true)
  const [redirectPath, setRedirectPath] = React.useState('/login')
  
  React.useEffect(() => {
    const checkUserRole = async () => {
      if (!isAuthenticated) {
        setRedirectPath('/login')
        setLoading(false)
        return
      }
      
      try {
        const userData = JSON.parse(localStorage.getItem('user'))
        
        // Check localStorage first
        if (userData) {
          if (userData.role === 'admin' || userData.role === 'master' || userData.isAdmin === true) {
            setRedirectPath('/admin')
          } else {
            setRedirectPath('/dashboard')
          }
          setLoading(false)
          return
        }
        
        // If no cached data, fetch from API
        const { authAPI } = await import('./utils/api')
        const currentUser = await authAPI.getCurrentUser()
        
        // Store for future checks
        localStorage.setItem('user', JSON.stringify(currentUser))
        
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'master' || currentUser.isAdmin === true)) {
          setRedirectPath('/admin')
        } else {
          setRedirectPath('/dashboard')
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        setRedirectPath('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    checkUserRole()
  }, [isAuthenticated])
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  }
  
  return <Navigate to={redirectPath} />
}

function App() {
  // Create a custom theme
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Print Hub */}
          <Route path="/print-hub" element={<PrintHub />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="print-jobs" element={<PrintJobManagement />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="points" element={<PointsManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Redirect root to dashboard if logged in, otherwise to login */}
          <Route 
            path="/" 
            element={<RootRedirect />} 
          />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </ThemeProvider>
  )
}

export default App
