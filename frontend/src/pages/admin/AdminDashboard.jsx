import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { FiTrendingUp, FiShoppingBag, FiUsers, FiPackage, FiArrowRight, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { analyticsAPI } from '@services/api'
import { formatPrice, formatDate, getOrderStatusConfig } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'

function StatCard({ title, value, sub, icon: Icon, color, trend, linkTo }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{title}</p>
      <p className="font-display font-black text-3xl text-brand-900 mb-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {linkTo && <Link to={linkTo} className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-3 hover:text-brand-800 transition-colors">View all <FiArrowRight size={11} /></Link>}
    </motion.div>
  )
}

function MiniChart({ data = [] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.revenue || 0), 1)
  return (
    <div className="flex items-end gap-1 h-14">
      {data.slice(-20).map((d, i) => (
        <div key={i} title={`${d._id}: ${formatPrice(d.revenue)}`}
          className="flex-1 bg-brand-500/30 hover:bg-brand-500 rounded-t transition-colors cursor-pointer"
          style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => analyticsAPI.getDashboard().then(r => r.data),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  })

  if (isLoading) return <PageLoader />

  const { stats = {}, recentOrders = [], topProducts = [], ordersByStatus = [], dailyRevenue = [] } = data || {}

  const statCards = [
    { title: 'Total Revenue',   value: formatPrice(stats.totalRevenue), sub: `${formatPrice(stats.monthRevenue)} this month`, icon: FiTrendingUp, color: 'bg-brand-gradient', trend: stats.revenueGrowth, linkTo: '/admin/analytics' },
    { title: 'Total Orders',    value: (stats.totalOrders || 0).toLocaleString(), sub: `${stats.monthOrders || 0} this month`, icon: FiShoppingBag, color: 'bg-amber-400', linkTo: '/admin/orders' },
    { title: 'Customers',       value: (stats.totalUsers || 0).toLocaleString(), sub: 'Registered users', icon: FiUsers, color: 'bg-green-500', linkTo: '/admin/customers' },
    { title: 'Products',        value: (stats.totalProducts || 0).toLocaleString(), sub: 'Active listings', icon: FiPackage, color: 'bg-purple-500', linkTo: '/admin/products' },
  ]

  return (
    <>
      <Helmet><title>Dashboard | ONE PIECE Admin</title></Helmet>
      <div className="space-y-7">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-3xl text-brand-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex gap-3">
            {stats.pendingOrders > 0 && (
              <Link to="/admin/orders?status=pending" className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                <FiAlertCircle size={15} /> {stats.pendingOrders} pending orders
              </Link>
            )}
            {stats.returnsCount > 0 && (
              <Link to="/admin/returns" className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                <FiRefreshCw size={15} /> {stats.returnsCount} returns
              </Link>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* Revenue chart + order status */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Revenue (Last 20 Days)</h2>
              <Link to="/admin/analytics" className="text-xs text-brand-600 font-medium hover:text-brand-800">Full Analytics →</Link>
            </div>
            <MiniChart data={dailyRevenue} />
            {dailyRevenue.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No revenue data yet</p>}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Orders by Status</h2>
            <div className="space-y-3">
              {ordersByStatus.map(({ _id: status, count }) => {
                const cfg = getOrderStatusConfig(status)
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={cfg.color}>{cfg.label}</span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                )
              })}
              {!ordersByStatus.length && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
            </div>
          </div>
        </div>

        {/* Recent orders + top products */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-brand-600 font-medium hover:text-brand-800">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Order', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(order => {
                    const cfg = getOrderStatusConfig(order.orderStatus)
                    return (
                      <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <Link to={`/admin/orders/${order._id}`} className="font-medium text-brand-700 hover:text-brand-900 font-mono text-xs">
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 truncate max-w-[120px]">
                          {order.user?.name || order.guestInfo?.name || 'Guest'}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-brand-900">{formatPrice(order.pricing?.total)}</td>
                        <td className="py-3 pr-4"><span className={cfg.color}>{cfg.label}</span></td>
                        <td className="py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                      </tr>
                    )
                  })}
                  {!recentOrders.length && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Top Products</h2>
              <Link to="/admin/products" className="text-xs text-brand-600 font-medium hover:text-brand-800">View All →</Link>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={product._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                  <div className="w-10 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                    {product.images?.[0]?.url && <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.soldCount || 0} sold</p>
                  </div>
                  <p className="text-xs font-bold text-brand-800 shrink-0">{formatPrice(product.price)}</p>
                </div>
              ))}
              {!topProducts.length && <p className="text-sm text-gray-400 text-center py-4">No products yet</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
