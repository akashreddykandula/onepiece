import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiCopy } from 'react-icons/fi'
import { couponAPI } from '@services/api'
import { formatPrice, formatDate } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'
import toast from 'react-hot-toast'

export default function AdminCoupons() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const { register, handleSubmit, reset, setValue, watch, formState:{ errors } } = useForm({
    defaultValues: { discountType:'percentage', usagePerUser:1, usageLimit:'', minOrderAmount:0, maxDiscountAmount:0 }
  })
  const discountType = watch('discountType')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponAPI.getAll().then(r => r.data.coupons),
    staleTime: 30000,
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editItem ? couponAPI.update(editItem._id, d) : couponAPI.create(d),
    onSuccess: () => { qc.invalidateQueries(['admin-coupons']); toast.success(editItem ? 'Coupon updated!' : 'Coupon created!'); setShowForm(false); setEditItem(null); reset() },
    onError: err => toast.error(err.response?.data?.message || 'Save failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => couponAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries(['admin-coupons']); toast.success('Coupon deleted') },
  })

  const openEdit = (c) => {
    setEditItem(c)
    const toDateLocal = (d) => d ? new Date(d).toISOString().slice(0,16) : ''
    setValue('code', c.code); setValue('description', c.description||'')
    setValue('discountType', c.discountType); setValue('discountValue', c.discountValue)
    setValue('maxDiscountAmount', c.maxDiscountAmount||0); setValue('minOrderAmount', c.minOrderAmount||0)
    setValue('usageLimit', c.usageLimit||''); setValue('usagePerUser', c.usagePerUser||1)
    setValue('validFrom', toDateLocal(c.validFrom)); setValue('validUntil', toDateLocal(c.validUntil))
    setValue('isActive', c.isActive)
    setShowForm(true)
  }

  const copyCode = (code) => { navigator.clipboard?.writeText(code); toast.success(`Copied: ${code}`) }

  const now = new Date()

  return (
    <>
      <Helmet><title>Coupons | Admin</title></Helmet>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display font-bold text-2xl text-brand-900">Coupons</h1><p className="text-sm text-gray-400">{data?.length||0} coupons</p></div>
          <button onClick={() => { setEditItem(null); reset(); setShowForm(true) }} className="btn-primary"><FiPlus size={15}/> Create Coupon</button>
        </div>

        {showForm && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="card p-6 border-2 border-brand-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-brand-900">{editItem ? 'Edit' : 'New'} Coupon</h2>
              <button onClick={() => { setShowForm(false); setEditItem(null); reset() }} className="btn-icon"><FiX size={16}/></button>
            </div>
            <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Coupon Code *</label>
                <input {...register('code',{required:'Code is required'})} className={`input uppercase ${errors.code?'input-error':''}`} placeholder="e.g. SAVE20" style={{textTransform:'uppercase'}}/>
                {errors.code && <p className="error-msg">{errors.code.message}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <input {...register('description')} className="input" placeholder="e.g. 20% off on all orders"/>
              </div>
              <div>
                <label className="label">Discount Type *</label>
                <select {...register('discountType',{required:true})} className="input">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="label">Discount Value *</label>
                <input {...register('discountValue',{required:'Required',min:{value:1,message:'Min 1'}})} type="number" min="0" className={`input ${errors.discountValue?'input-error':''}`} placeholder={discountType==='percentage'?'20':'200'}/>
                {errors.discountValue && <p className="error-msg">{errors.discountValue.message}</p>}
              </div>
              {discountType==='percentage' && (
                <div>
                  <label className="label">Max Discount Amount (₹)</label>
                  <input {...register('maxDiscountAmount')} type="number" min="0" className="input" placeholder="0 = no limit"/>
                </div>
              )}
              <div>
                <label className="label">Min Order Amount (₹)</label>
                <input {...register('minOrderAmount')} type="number" min="0" className="input" placeholder="0 = no minimum"/>
              </div>
              <div>
                <label className="label">Total Usage Limit</label>
                <input {...register('usageLimit')} type="number" min="0" className="input" placeholder="Leave blank for unlimited"/>
              </div>
              <div>
                <label className="label">Per User Limit</label>
                <input {...register('usagePerUser')} type="number" min="1" className="input" placeholder="1"/>
              </div>
              <div>
                <label className="label">Valid From *</label>
                <input {...register('validFrom',{required:'Required'})} type="datetime-local" className={`input ${errors.validFrom?'input-error':''}`}/>
                {errors.validFrom && <p className="error-msg">{errors.validFrom.message}</p>}
              </div>
              <div>
                <label className="label">Valid Until *</label>
                <input {...register('validUntil',{required:'Required'})} type="datetime-local" className={`input ${errors.validUntil?'input-error':''}`}/>
                {errors.validUntil && <p className="error-msg">{errors.validUntil.message}</p>}
              </div>
              <div className="flex items-center gap-3">
                <input {...register('isActive')} type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600"/>
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={saveMutation.isPending} className="btn-primary disabled:opacity-60">
                  <FiCheck size={14}/> {saveMutation.isPending ? 'Saving…' : editItem ? 'Update' : 'Create Coupon'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); reset() }} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}

        {isLoading ? <PageLoader/> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.map(coupon => {
              const expired  = new Date(coupon.validUntil) < now
              const notStart = new Date(coupon.validFrom) > now
              const status   = !coupon.isActive ? 'Inactive' : expired ? 'Expired' : notStart ? 'Upcoming' : 'Active'
              const statusColor = status==='Active' ? 'bg-green-100 text-green-700' : status==='Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
              return (
                <div key={coupon._id} className="card p-5 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyCode(coupon.code)} className="font-display font-black text-xl text-brand-900 tracking-wider hover:text-brand-700 transition-colors flex items-center gap-1.5" title="Click to copy">
                        {coupon.code} <FiCopy size={12} className="text-gray-400"/>
                      </button>
                    </div>
                    <span className={`badge text-[10px] ${statusColor}`}>{status}</span>
                  </div>
                  {coupon.description && <p className="text-xs text-gray-500 mb-3">{coupon.description}</p>}
                  <div className="bg-brand-50 rounded-xl px-3 py-2 mb-3">
                    <p className="font-bold text-brand-800">
                      {coupon.discountType==='percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      {coupon.maxDiscountAmount>0 && ` (max ₹${coupon.maxDiscountAmount})`}
                    </p>
                    {coupon.minOrderAmount>0 && <p className="text-xs text-brand-600 mt-0.5">Min order: {formatPrice(coupon.minOrderAmount)}</p>}
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between"><span>Used</span><span className="font-medium">{coupon.usedCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}</span></div>
                    <div className="flex justify-between"><span>Valid</span><span className="font-medium">{formatDate(coupon.validFrom)} – {formatDate(coupon.validUntil)}</span></div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(coupon)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"><FiEdit2 size={11}/> Edit</button>
                    <button onClick={() => { if(confirm('Delete this coupon?')) deleteMutation.mutate(coupon._id) }} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 ml-auto"><FiTrash2 size={11}/> Delete</button>
                  </div>
                </div>
              )
            })}
            {!data?.length && <div className="md:col-span-3 text-center py-12 text-gray-400">No coupons yet</div>}
          </div>
        )}
      </div>
    </>
  )
}
