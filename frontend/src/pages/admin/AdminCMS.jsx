import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiEdit2, FiCheck, FiX, FiEye } from 'react-icons/fi'
import { cmsAPI } from '@services/api'
import { formatDate } from '@utils/helpers'
import PageLoader from '@components/ui/PageLoader'
import toast from 'react-hot-toast'

const DEFAULT_PAGES = [
  { slug:'about',    title:'About Us' },
  { slug:'privacy',  title:'Privacy Policy' },
  { slug:'terms',    title:'Terms of Service' },
  { slug:'shipping', title:'Shipping Policy' },
  { slug:'returns',  title:'Returns & Exchange' },
  { slug:'faqs',     title:'FAQs' },
  { slug:'contact',  title:'Contact Us' },
  { slug:'size-guide',title:'Size Guide' },
]

export default function AdminCMS() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle]     = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cms'],
    queryFn: () => cmsAPI.getAllAdmin().then(r => r.data.pages),
    staleTime: 60000,
  })

  const saveMutation = useMutation({
    mutationFn: (d) => cmsAPI.upsert(editing.slug, d),
    onSuccess: () => { qc.invalidateQueries(['admin-cms']); toast.success('Page saved!'); setEditing(null) },
    onError: err => toast.error(err.response?.data?.message || 'Save failed'),
  })

  const openEdit = (page) => {
    const existing = data?.find(p => p.slug === page.slug)
    setEditing({ slug: page.slug, title: page.title })
    setTitle(existing?.title || page.title)
    setContent(existing?.content || '')
  }

  const pagesMap = new Map((data||[]).map(p => [p.slug, p]))

  return (
    <>
      <Helmet><title>CMS Pages | Admin</title></Helmet>
      <div className="space-y-5">
        <div><h1 className="font-display font-bold text-2xl text-brand-900">CMS Pages</h1><p className="text-sm text-gray-400">Manage static content pages</p></div>

        {editing ? (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-brand-900">Editing: {editing.title}</h2>
              <div className="flex gap-2">
                <a href={`/pages/${editing.slug}`} target="_blank" rel="noreferrer" className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"><FiEye size={13}/> Preview</a>
                <button onClick={()=>setEditing(null)} className="btn-icon"><FiX size={16}/></button>
              </div>
            </div>
            <div>
              <label className="label">Page Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="input" placeholder="Page title"/>
            </div>
            <div>
              <label className="label">Content (HTML supported)</label>
              <textarea
                value={content}
                onChange={e=>setContent(e.target.value)}
                className="input resize-y font-mono text-sm"
                style={{minHeight:'320px'}}
                placeholder="<h2>Your content here</h2><p>Supports HTML formatting</p>"
              />
              <p className="text-xs text-gray-400 mt-1">Supports HTML. Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;a&gt; tags for formatting.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>saveMutation.mutate({title,content,slug:editing.slug,isActive:true})} disabled={saveMutation.isPending} className="btn-primary disabled:opacity-60">
                <FiCheck size={15}/> {saveMutation.isPending?'Saving…':'Save Page'}
              </button>
              <button onClick={()=>setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_PAGES.map(page => {
              const existing = pagesMap.get(page.slug)
              return (
                <div key={page.slug} className="card p-5 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{page.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">/pages/{page.slug}</p>
                    </div>
                    <span className={`badge text-[10px] ${existing?.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {existing?'Published':'Draft'}
                    </span>
                  </div>
                  {existing?.updatedAt && <p className="text-xs text-gray-400">Last updated: {formatDate(existing.updatedAt)}</p>}
                  {!existing && <p className="text-xs text-gray-400 italic">Not created yet</p>}
                  {existing?.content && <p className="text-xs text-gray-500 mt-2 line-clamp-2" dangerouslySetInnerHTML={{__html: existing.content.replace(/<[^>]+>/g,'').slice(0,80)+'…'}}/>}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>openEdit(page)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                      <FiEdit2 size={11}/> {existing?'Edit':'Create'}
                    </button>
                    {existing && (
                      <a href={`/pages/${page.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1">
                        <FiEye size={11}/> Preview
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
