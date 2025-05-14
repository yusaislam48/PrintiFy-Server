import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import PrintHub from './pages/printing/PrintHub'
import './App.css'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  // Create a custom theme
  const theme = createTheme({
    palette: {
      primary: {
        main: '#111',
        light: '#333',
        dark: '#000',
        contrastText: '#fff',
      },
      secondary: {
        main: '#f50057',
        light: '#f73378',
        dark: '#ab003c',
        contrastText: '#fff',
      },
      background: {
        default: '#f9f9f9',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 700,
      },
      button: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/print-hub" element={<PrintHub />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              localStorage.getItem('token') 
                ? <Navigate to="/dashboard" replace /> 
                : <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
