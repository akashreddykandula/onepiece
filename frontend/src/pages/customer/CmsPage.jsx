import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { cmsAPI } from '@services/api'
import PageLoader from '@components/ui/PageLoader'
import { slugToTitle } from '@utils/helpers'

export default function CmsPage() {
  const { slug } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['cms', slug],
    queryFn: () => cmsAPI.getPage(slug).then(r => r.data.page),
    enabled: !!slug,
  })

  if (isLoading) return <PageLoader />

  const title = data?.title || slugToTitle(slug)

  return (
    <>
      <Helmet><title>{title} | ONE PIECE</title></Helmet>
      <div className="page-header py-14">
        <div className="container-op text-center">
          <h1 className="font-display font-black text-4xl md:text-5xl text-white">{title}</h1>
        </div>
      </div>
      <div className="container-op py-12 max-w-4xl mx-auto">
        {data?.content ? (
          <article className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-brand-900 prose-a:text-brand-600" dangerouslySetInnerHTML={{ __html: data.content }} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Content coming soon</p>
          </div>
        )}
      </div>
    </>
  )
}
