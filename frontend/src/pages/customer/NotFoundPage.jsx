import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiHome, FiSearch } from 'react-icons/fi'

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>404 — Page Not Found | ONE PIECE</title></Helmet>
      <div className="min-h-screen bg-ice flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="font-display font-black text-[10rem] leading-none text-brand-100 select-none">
              404
            </div>
            <h1 className="font-display font-bold text-3xl text-brand-900 -mt-6 mb-3">Page Not Found</h1>
            <p className="text-gray-400 mb-8">Looks like this page has gone out of style. Let's get you back on track.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="btn-primary justify-center">
                <FiHome size={16} /> Back to Home
              </Link>
              <Link to="/collections" className="btn-secondary justify-center">
                <FiSearch size={16} /> Browse Collections
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
