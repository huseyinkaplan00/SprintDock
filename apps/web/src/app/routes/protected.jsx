import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth.js'
import { LoadingScreen } from '../../components/common/loading-screen.jsx'

export default function ProtectedRoute({ children }) {
  const { hydrated, isAuthenticated } = useAuth()
  if (!hydrated) return <LoadingScreen label="Oturum kontrol ediliyor..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
