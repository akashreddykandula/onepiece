// ErrorBoundary.jsx
import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info) }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center bg-ice p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="heading-md mb-3">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="btn-primary gap-2">
            <FiRefreshCw size={16} /> Refresh Page
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}
export default ErrorBoundary
