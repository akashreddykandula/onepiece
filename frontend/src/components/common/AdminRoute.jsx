import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AdminRoute({ children }) {
  const { user, token } = useSelector(s => s.auth)
  if (!token || !user) return <Navigate to="/login?redirect=/admin" replace />
  if (!['admin', 'superadmin'].includes(user.role)) return <Navigate to="/" replace />
  return children
}
