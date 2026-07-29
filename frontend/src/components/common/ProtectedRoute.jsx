import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute() {
  const { user } = useSelector(s => s.auth)
  const location = useLocation()
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  return <Outlet />
}
