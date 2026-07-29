import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function GuestRoute() {
  const { user } = useSelector(s => s.auth)
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
