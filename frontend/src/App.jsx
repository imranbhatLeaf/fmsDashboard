import React from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Registrar from './pages/Registrar'
import Form from './pages/Form'

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default → login */}
          <Route path='/' element={<Navigate to='/login' replace />} />

          {/* Public */}
          <Route path='/login' element={<Login />} />
          <Route path='/form/:token' element={<Form />} />

          {/* Protected */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute requiredRole='admin'>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path='/registrar'
            element={
              <ProtectedRoute requiredRole='registrar'>
                <Registrar />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path='*' element={<Navigate to='/login' replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
