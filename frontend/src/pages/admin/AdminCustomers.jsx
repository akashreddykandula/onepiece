import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiSearch, FiToggleLeft, FiToggleRight, FiEye } from 'react-icons/fi'
import api from '@services/api'
import { formatPrice, formatDate } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => api.get('/admin/users', { params:{ search, page, limit:20 } }).then(r=>r.data),
    staleTime: 30000,
  })

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['admin-customers']); toast.success('Status updated') },
  })

  const users = data?.users || []
  const pages = data?.pages || 1

  return (
    <>
      <Helmet><title>Customers | Admin</title></Helmet>
      <div className="space-y-5">
        <div><h1 className="font-display font-bold text-2xl text-brand-900">Customers</h1><p className="text-sm text-gray-400">{data?.total||0} registered users</p></div>

        <div className="card p-5">
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} className="input pl-9 text-sm py-2" placeholder="Search by name, email, phone…"/>
            </div>
          </div>

          {isLoading?<PageLoader/>:(
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="border-b border-gray-100">{['Customer','Phone','Orders','Spent','Points','Joined','Status',''].map(h=><th key={h} className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide pb-3 pr-3">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u=>(
                      <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-bold">{u.name?.[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-xs text-gray-900">{u.name}</p>
                              <p className="text-[10px] text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-500">{u.phone||'—'}</td>
                        <td className="py-3 pr-3 font-semibold text-xs text-gray-900">{u.totalOrders||0}</td>
                        <td className="py-3 pr-3 font-semibold text-xs text-brand-800">{formatPrice(u.totalSpent||0)}</td>
                        <td className="py-3 pr-3 text-xs text-amber-600 font-semibold">⭐ {u.loyaltyPoints||0}</td>
                        <td className="py-3 pr-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                        <td className="py-3 pr-3">
                          <span className={`badge text-[10px] ${u.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>{u.isActive?'Active':'Banned'}</span>
                        </td>
                        <td className="py-3">
                          <button onClick={()=>{if(confirm(`${u.isActive?'Ban':'Activate'} ${u.name}?`))toggleMutation.mutate(u._id)}}
                            className={`btn-icon opacity-0 group-hover:opacity-100 transition-opacity ${u.isActive?'text-red-400 hover:text-red-600':'text-green-500 hover:text-green-700'}`}
                            title={u.isActive?'Ban user':'Activate user'}>
                            {u.isActive?<FiToggleRight size={16}/>:<FiToggleLeft size={16}/>}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!users.length&&<tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No customers found</td></tr>}
                  </tbody>
                </table>
              </div>
              {pages>1&&(
                <div className="flex justify-center gap-2 mt-5">
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Prev</button>
                  <span className="text-sm text-gray-500 px-3 flex items-center">Page {page} of {pages}</span>
                  <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
