import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiCheck, FiX, FiMessageSquare } from 'react-icons/fi'
import { reviewAPI } from '@services/api'
import { formatDate, timeAgo } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const [filter, setFilter] = useState('false')
  const [replyId, setReplyId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: () => reviewAPI.getAll({ isApproved: filter, limit: 30 }).then(r=>r.data),
    staleTime: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: ({id,v}) => reviewAPI.approve(id, v),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Review updated') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => reviewAPI.remove(id),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Review deleted') },
  })
  const replyMutation = useMutation({
    mutationFn: ({id,c}) => reviewAPI.reply(id, c),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success('Reply posted'); setReplyId(null); setReplyText('') },
  })

  const reviews = data?.reviews || []

  return (
    <>
      <Helmet><title>Reviews | Admin</title></Helmet>
      <div className="space-y-5">
        <div><h1 className="font-display font-bold text-2xl text-brand-900">Reviews</h1><p className="text-sm text-gray-400">{data?.total||0} reviews</p></div>

        <div className="flex gap-2">
          {[{v:'false',l:'Pending Approval'},{v:'true',l:'Approved'},{v:'',l:'All'}].map(tab=>(
            <button key={tab.v} onClick={()=>setFilter(tab.v)} className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter===tab.v?'bg-brand-800 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}>{tab.l}</button>
          ))}
        </div>

        {isLoading?<PageLoader/>:(
          <div className="space-y-4">
            {reviews.map(r=>(
              <div key={r._id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-brand-gradient rounded-full flex items-center justify-center shrink-0"><span className="text-white text-xs font-bold">{r.user?.name?.[0]}</span></div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.user?.name}</p>
                      <p className="text-xs text-gray-400">{r.user?.email} · {timeAgo(r.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{[...Array(5)].map((_,i)=><span key={i} className={`text-xs ${i<r.rating?'text-amber-400':'text-gray-200'}`}>★</span>)}</div>
                        <span className="text-xs text-gray-500">{r.product?.name}</span>
                        {r.isVerifiedPurchase&&<span className="badge-green text-[9px]">✓ Verified</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-[10px] ${r.isApproved?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{r.isApproved?'Approved':'Pending'}</span>
                    {!r.isApproved&&<button onClick={()=>approveMutation.mutate({id:r._id,v:true})} className="btn-icon text-green-500 hover:text-green-700 hover:bg-green-50" title="Approve"><FiCheck size={15}/></button>}
                    {r.isApproved&&<button onClick={()=>approveMutation.mutate({id:r._id,v:false})} className="btn-icon text-amber-500 hover:bg-amber-50" title="Unapprove"><FiX size={15}/></button>}
                    <button onClick={()=>setReplyId(replyId===r._id?null:r._id)} className="btn-icon text-brand-500 hover:bg-brand-50" title="Reply"><FiMessageSquare size={15}/></button>
                    <button onClick={()=>{if(confirm('Delete this review?'))deleteMutation.mutate(r._id)}} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><FiX size={15}/></button>
                  </div>
                </div>
                {r.title&&<p className="font-semibold text-sm text-gray-900 mt-3">{r.title}</p>}
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>
                {r.adminReply&&<div className="mt-3 p-3 bg-brand-50 rounded-xl border-l-2 border-brand-500"><p className="text-xs font-semibold text-brand-700">Your Reply:</p><p className="text-xs text-gray-600 mt-0.5">{r.adminReply.comment}</p></div>}
                {replyId===r._id&&(
                  <div className="mt-3 flex gap-2">
                    <input value={replyText} onChange={e=>setReplyText(e.target.value)} className="input text-sm flex-1 py-2" placeholder="Write a reply…"/>
                    <button onClick={()=>replyMutation.mutate({id:r._id,c:replyText})} disabled={!replyText.trim()||replyMutation.isPending} className="btn-primary text-sm py-2 px-4 disabled:opacity-60">Post</button>
                    <button onClick={()=>setReplyId(null)} className="btn-ghost text-sm py-2 px-3">Cancel</button>
                  </div>
                )}
              </div>
            ))}
            {!reviews.length&&<div className="card p-10 text-center text-gray-400">No reviews to show</div>}
          </div>
        )}
      </div>
    </>
  )
}
