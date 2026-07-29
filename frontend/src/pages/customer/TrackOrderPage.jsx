import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { FiSearch, FiPackage, FiArrowRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { orderAPI } from '@services/api'
import { formatPrice, formatDate, getDeliveryEstimate, orderSupportMessage, openWhatsApp } from '@utils/helpers'
import { ORDER_STATUSES, ORDER_TIMELINE_STEPS } from '@constants'
import toast from 'react-hot-toast'

function MiniTimeline({ status }) {
  const currentStep = ORDER_STATUSES[status]?.step ?? 0
  const isCancelled = ['cancelled', 'returned'].includes(status)
  return (
    <div className="flex items-center justify-between mt-4">
      {ORDER_TIMELINE_STEPS.map((step, i) => {
        const done   = !isCancelled && currentStep > i
        const active = !isCancelled && currentStep === i + 1
        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {i > 0 && <div className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-10 ${done ? 'bg-brand-500' : 'bg-gray-200'}`} />}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 text-xs font-bold transition-all ${
              done ? 'bg-brand-600 text-white' : active ? 'bg-brand-800 text-white ring-4 ring-brand-100' : 'bg-gray-100 text-gray-300'
            }`}>
              {done ? '✓' : step.icon}
            </div>
            <p className={`text-[9px] mt-1 text-center font-medium leading-tight ${active ? 'text-brand-800' : done ? 'text-brand-500' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackOrderPage() {
  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ orderNumber, email }) => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await orderAPI.track({ orderNumber: orderNumber.trim(), email: email.trim() })
      setOrder(res.data.order)
    } catch (err) {
      setOrder(null)
      toast.error(err.response?.data?.message || 'No order found with these details')
    } finally {
      setLoading(false)
    }
  }

  const statusCfg = order ? ORDER_STATUSES[order.orderStatus] : null

  return (
    <>
      <Helmet><title>Track Your Order | ONE PIECE</title></Helmet>

      <div className="page-header py-16">
        <div className="container-op text-center">
          <FiPackage size={36} className="text-brand-300 mx-auto mb-4" />
          <h1 className="font-display font-black text-4xl md:text-5xl text-white">Track Your Order</h1>
          <p className="text-white/60 mt-3 text-sm">Enter your order details to see real-time status</p>
        </div>
      </div>

      <div className="container-op py-12 max-w-2xl mx-auto">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="card p-8 mb-8"
        >
          <h2 className="font-display font-semibold text-xl text-brand-900 mb-5">Order Lookup</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Order Number</label>
              <input
                {...register('orderNumber', { required: 'Order number is required' })}
                className={`input ${errors.orderNumber ? 'input-error' : ''}`}
                placeholder="e.g. OP1234567890"
              />
              {errors.orderNumber && <p className="error-msg">{errors.orderNumber.message}</p>}
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="Email used when placing the order"
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full justify-center py-4 ${loading ? 'opacity-70' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
                  Searching…
                </span>
              ) : (
                <><FiSearch size={17} /> Track Order</>
              )}
            </button>
          </div>
        </motion.form>

        <AnimatePresence>
          {searched && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {order ? (
                <div className="card p-6 md:p-8 space-y-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Order</p>
                      <p className="font-display font-bold text-2xl text-brand-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={statusCfg?.color}>{statusCfg?.label}</span>
                  </div>

                  <div className="p-4 bg-brand-50 rounded-2xl">
                    <p className="text-sm font-semibold text-brand-800">
                      📦 {getDeliveryEstimate(order.tracking?.estimatedDelivery, order.orderStatus)}
                    </p>
                    {order.tracking?.trackingNumber && (
                      <p className="text-xs text-brand-600 mt-1">
                        Tracking: <span className="font-mono font-bold">{order.tracking.trackingNumber}</span>
                        {order.tracking.courier && ` via ${order.tracking.courier}`}
                      </p>
                    )}
                  </div>

                  <MiniTimeline status={order.orderStatus} />

                  {/* Recent timeline */}
                  {order.timeline?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Latest Updates</p>
                      <div className="space-y-3">
                        {[...order.timeline].reverse().slice(0, 4).map((ev, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 capitalize">{ev.status.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-500">{ev.message}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(ev.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items</p>
                    <div className="space-y-3">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-400">Qty: {item.quantity}{item.size && ` · ${item.size}`}</p>
                          </div>
                          <p className="text-sm font-bold text-brand-800">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openWhatsApp(orderSupportMessage(order.orderNumber))}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-[#25D366] text-[#25D366] rounded-xl font-semibold text-sm hover:bg-[#25D366] hover:text-white transition-all"
                    >
                      <FaWhatsapp size={16} /> Get Help on WhatsApp
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-10 text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSearch size={28} className="text-red-300" />
                  </div>
                  <p className="font-display font-semibold text-xl text-gray-900 mb-2">Order not found</p>
                  <p className="text-sm text-gray-400 mb-6">Please check your order number and email address</p>
                  <button
                    onClick={() => openWhatsApp('Hi ONE PIECE! I cannot find my order. Can you help?')}
                    className="flex items-center justify-center gap-2 py-3 border-2 border-[#25D366] text-[#25D366] rounded-xl font-semibold text-sm hover:bg-[#25D366] hover:text-white transition-all mx-auto px-6"
                  >
                    <FaWhatsapp size={16} /> Contact Support
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
