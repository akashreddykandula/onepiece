import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiEdit2, FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi'
import { productAPI } from '@services/api'
import { formatPrice } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'
import toast from 'react-hot-toast'

export default function AdminInventory() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [editStock, setEditStock] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inventory', search],
    queryFn: () => productAPI.getAllAdmin({ search, limit: 50, isActive: 'true' }).then(r => r.data),
    staleTime: 30000,
  })

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }) => productAPI.updateStock(id, { stock: Number(stock) }),
    onSuccess: () => { qc.invalidateQueries(['admin-inventory']); toast.success('Stock updated!'); setEditId(null) },
    onError: () => toast.error('Update failed'),
  })

  const allProducts = data?.products || []
  const products = lowStock ? allProducts.filter(p => p.stock <= (p.lowStockThreshold||5)) : allProducts
  const lowStockCount = allProducts.filter(p => p.stock <= (p.lowStockThreshold||5)).length

  return (
    <>
      <Helmet><title>Inventory | Admin</title></Helmet>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-brand-900">Inventory</h1>
            <p className="text-sm text-gray-400">{data?.total||0} products tracked</p>
          </div>
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium">
              <FiAlertTriangle size={15}/> {lowStockCount} products low on stock
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex gap-3 flex-wrap mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9 text-sm py-2" placeholder="Search products…"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 hover:border-brand-400 transition-colors">
              <input type="checkbox" checked={lowStock} onChange={e=>setLowStock(e.target.checked)} className="w-4 h-4 accent-brand-600"/>
              <span className="text-sm text-gray-700 font-medium">Low Stock Only</span>
            </label>
          </div>

          {isLoading ? <PageLoader/> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Product','SKU','Price','Stock','Status','Update Stock'].map(h=>(
                      <th key={h} className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => {
                    const threshold = p.lowStockThreshold || 5
                    const isLow = p.stock <= threshold
                    const isOut = p.stock === 0
                    return (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-10 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                              {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-full h-full object-cover"/>}
                            </div>
                            <p className="font-medium text-xs text-gray-900 line-clamp-1 max-w-[160px]">{p.name}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="py-3 pr-4 font-semibold text-xs text-brand-800">{formatPrice(p.price)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${isOut?'text-red-600':isLow?'text-amber-600':'text-green-600'}`}>{p.stock}</span>
                            {isLow && !isOut && <FiAlertTriangle size={12} className="text-amber-500"/>}
                            {isOut && <span className="badge bg-red-100 text-red-600 text-[10px]">Out</span>}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`badge text-[10px] ${p.isInStock?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{p.isInStock?'In Stock':'Out of Stock'}</span>
                        </td>
                        <td className="py-3">
                          {editId === p._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min="0" value={editStock}
                                onChange={e=>setEditStock(e.target.value)}
                                className="input text-sm py-1.5 w-20"
                                autoFocus
                                onKeyDown={e=>{if(e.key==='Enter')stockMutation.mutate({id:p._id,stock:editStock});if(e.key==='Escape')setEditId(null)}}
                              />
                              <button onClick={()=>stockMutation.mutate({id:p._id,stock:editStock})} className="btn-icon text-green-500 hover:bg-green-50 hover:text-green-700" title="Save"><FiCheck size={14}/></button>
                              <button onClick={()=>setEditId(null)} className="btn-icon text-red-400 hover:bg-red-50" title="Cancel"><FiX size={14}/></button>
                            </div>
                          ) : (
                            <button onClick={()=>{setEditId(p._id);setEditStock(p.stock)}} className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors">
                              <FiEdit2 size={12}/> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {!products.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">{lowStock?'No low-stock products':'No products found'}</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
