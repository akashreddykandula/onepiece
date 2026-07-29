import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { FiTrendingUp, FiShoppingBag, FiUsers, FiPackage, FiBarChart2 } from 'react-icons/fi'
import { analyticsAPI } from '@services/api'
import { formatPrice, formatNumber } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'

function SimpleBarChart({ data, keyX, keyY, color = '#0A5ACB', height = 160 }) {
  if (!data?.length) return <p className="text-center text-gray-400 text-sm py-8">No data available</p>
  const max = Math.max(...data.map(d => d[keyY] || 0), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            title={`${d[keyX]}: ${formatPrice(d[keyY])}`}
            className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer"
            style={{ height: `${Math.max(4, (d[keyY] / max) * (height - 20))}px`, background: color }}
          />
          <span className="text-[8px] text-gray-400 truncate w-full text-center hidden sm:block">
            {String(d[keyX]).slice(-5)}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutSegment({ data = [] }) {
  if (!data.length) return <p className="text-center text-gray-400 text-sm py-4">No data</p>
  const total = data.reduce((s, d) => s + (d.revenue || 0), 0)
  const colors = ['#0A5ACB','#3B82F6','#7AB2E4','#0A2A80','#22C55E','#F59E0B','#EF4444','#8B5CF6']
  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((d, i) => {
        const pct = total > 0 ? Math.round((d.revenue / total) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: colors[i % colors.length] }}/>
            <span className="text-xs text-gray-600 flex-1 truncate">{d._id || 'Unknown'}</span>
            <span className="text-xs font-semibold text-gray-900">{pct}%</span>
            <span className="text-xs text-gray-400 w-20 text-right">{formatPrice(d.revenue)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d')

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['admin-analytics-dash'],
    queryFn: () => analyticsAPI.getDashboard().then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-analytics-sales', period],
    queryFn: () => analyticsAPI.getSales({ period }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  if (dashLoading) return <PageLoader/>

  const { stats = {}, dailyRevenue = [] } = dash || {}
  const { salesData = [], categoryRevenue = [], topProducts = [] } = sales || {}

  const statCards = [
    { label: 'Total Revenue',   value: formatPrice(stats.totalRevenue), icon: FiTrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'This Month',      value: formatPrice(stats.monthRevenue), icon: FiBarChart2,  color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders',    value: formatNumber(stats.totalOrders), icon: FiShoppingBag,color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Customers', value: formatNumber(stats.totalUsers),  icon: FiUsers,      color: 'text-purple-600',bg: 'bg-purple-50' },
  ]

  return (
    <>
      <Helmet><title>Analytics | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div><h1 className="font-display font-bold text-2xl text-brand-900">Analytics</h1><p className="text-sm text-gray-400">Business performance overview</p></div>
          <div className="flex gap-2">
            {['7d','30d','90d','365d'].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${period===p?'bg-brand-800 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                {p==='7d'?'7 Days':p==='30d'?'30 Days':p==='90d'?'3 Months':'1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} className="card p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={18} className={s.color}/>
              </div>
              <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
              <p className="font-display font-black text-2xl text-brand-900">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Daily Revenue</h2>
            {salesLoading && <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin"/>}
          </div>
          <SimpleBarChart data={salesData} keyX="_id" keyY="revenue" height={180}/>
        </div>

        {/* Category revenue + Top products */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Revenue by Category</h2>
            {salesLoading ? <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto"/> : <DonutSegment data={categoryRevenue}/>}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Top Products ({period})</h2>
            {salesLoading ? <PageLoader/> : (
              <div className="space-y-4">
                {topProducts.slice(0,8).map((p,i)=>(
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i+1}</span>
                    <div className="w-9 h-10 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.soldCount||0} sold · {p.category?.name}</p>
                    </div>
                    <p className="text-xs font-bold text-brand-800 shrink-0">{formatPrice(p.price)}</p>
                  </div>
                ))}
                {!topProducts.length && <p className="text-center text-gray-400 text-sm py-4">No products data</p>}
              </div>
            )}
          </div>
        </div>

        {/* Orders by status */}
        {dash?.ordersByStatus?.length>0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Orders by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {dash.ordersByStatus.map(({_id:status,count})=>(
                <div key={status} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="font-display font-black text-2xl text-brand-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{status.replace(/_/g,' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
