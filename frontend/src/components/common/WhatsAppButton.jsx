import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa'
import { FiX, FiMessageCircle } from 'react-icons/fi'
import { openWhatsApp } from '@utils/helpers'

const quickOptions = [
  { label: 'Track my order', msg: 'Hi ONE PIECE! I need help tracking my order.' },
  { label: 'Custom print enquiry', msg: 'Hi ONE PIECE! I want to enquire about custom printing services.' },
  { label: 'Return / Exchange', msg: 'Hi ONE PIECE! I would like to initiate a return or exchange.' },
  { label: 'General support', msg: 'Hi ONE PIECE! I need some help.' },
]

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-2xl shadow-card-hover overflow-hidden w-64 border border-gray-100"
          >
            <div className="bg-[#25D366] px-4 py-3">
              <div className="flex items-center gap-2">
                <FaWhatsapp size={18} className="text-white" />
                <div>
                  <p className="text-white font-semibold text-sm">ONE PIECE Support</p>
                  <p className="text-white/70 text-xs">Typically replies instantly</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {quickOptions.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => { openWhatsApp(opt.msg); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <FiMessageCircle size={13} className="text-[#25D366] shrink-0" />
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow animate-pulse-brand"
        aria-label="WhatsApp Support"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <FiX size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="wa" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <FaWhatsapp size={26} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
