import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { cmsAPI } from "@services/api";
import PageLoader from "@components/ui/PageLoader";
import { slugToTitle } from "@utils/helpers";
import {
  FiCheck,
  FiChevronDown,
  FiInfo,
  FiAlertCircle,
  FiPhone,
} from "react-icons/fi";

function CMSBlock({ block }) {
  if (!block) return null;

  switch (block.type) {
    case "hero":
      return (
        <section className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-red-600 text-white p-8 md:p-12 shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            {block.title && (
              <h2 className="font-display font-black text-3xl md:text-4xl">
                {block.title}
              </h2>
            )}

            {block.subtitle && (
              <p className="mt-3 text-lg md:text-xl text-white/85">
                {block.subtitle}
              </p>
            )}

            {block.content && (
              <p className="mt-6 text-sm md:text-base leading-7 text-white/80 max-w-2xl mx-auto">
                {block.content}
              </p>
            )}
          </div>
        </section>
      );

    case "text":
      return (
        <section className="py-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
            {block.title && (
              <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-900">
                {block.title}
              </h2>
            )}

            {block.content && (
              <p className="mt-4 text-gray-600 leading-8 whitespace-pre-line">
                {block.content}
              </p>
            )}
          </div>
        </section>
      );

    case "info":
      return (
        <section className="py-3">
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6 md:p-8">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-sm">
                <FiInfo size={19} />
              </div>

              <div>
                {block.title && (
                  <h2 className="font-display font-bold text-xl md:text-2xl text-brand-900">
                    {block.title}
                  </h2>
                )}

                {block.content && (
                  <p className="mt-2 text-gray-600 leading-7 whitespace-pre-line">
                    {block.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case "checklist":
      return (
        <section className="py-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
            {block.title && (
              <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-900">
                {block.title}
              </h2>
            )}

            <div className="mt-5 space-y-3">
              {(block.items || [])
                .filter((item) => item?.trim())
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl bg-gray-50 p-4"
                  >
                    <span className="shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <FiCheck size={14} />
                    </span>

                    <p className="text-gray-600 leading-7 pt-0.5">{item}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="py-3">
          <details className="group rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 md:p-6">
              <h2 className="font-display font-bold text-lg md:text-xl text-brand-900">
                {block.title}
              </h2>

              <FiChevronDown
                size={20}
                className="shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-6 md:px-6">
              <div className="border-t border-gray-100 pt-4">
                <p className="text-gray-600 leading-7 whitespace-pre-line">
                  {block.content}
                </p>
              </div>
            </div>
          </details>
        </section>
      );

    case "imageText":
      return (
        <section className="py-3">
          <div className="grid md:grid-cols-2 gap-6 items-center bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {block.image ? (
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={block.image}
                  alt={block.title || "ONE PIECE"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-sm text-gray-400">Image coming soon</span>
              </div>
            )}

            <div className="p-6 md:p-8">
              {block.title && (
                <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-900">
                  {block.title}
                </h2>
              )}

              {block.subtitle && (
                <p className="mt-2 text-brand-600 font-medium">
                  {block.subtitle}
                </p>
              )}

              {block.content && (
                <p className="mt-4 text-gray-600 leading-7 whitespace-pre-line">
                  {block.content}
                </p>
              )}
            </div>
          </div>
        </section>
      );

    case "notice":
      return (
        <section className="py-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 md:p-6">
            <div className="flex gap-4">
              <div className="shrink-0 text-amber-600 mt-0.5">
                <FiAlertCircle size={20} />
              </div>

              <div>
                {block.title && (
                  <h2 className="font-display font-bold text-lg text-gray-900">
                    {block.title}
                  </h2>
                )}

                {block.content && (
                  <p className="mt-1 text-sm md:text-base text-gray-700 leading-7 whitespace-pre-line">
                    {block.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case "contact":
      return (
        <section className="py-3">
          <div className="rounded-2xl bg-brand-900 text-white p-7 md:p-9">
            <div className="flex gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <FiPhone size={20} />
              </div>

              <div>
                {block.title && (
                  <h2 className="font-display font-bold text-2xl">
                    {block.title}
                  </h2>
                )}

                {block.content && (
                  <p className="mt-2 text-white/75 leading-7 whitespace-pre-line">
                    {block.content}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

export default function CmsPage() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["cms", slug],
    queryFn: () => cmsAPI.getPage(slug).then((r) => r.data.page),
    enabled: !!slug,
  });

  if (isLoading) return <PageLoader />;

  const title = data?.title || slugToTitle(slug);
  const blocks = Array.isArray(data?.blocks)
    ? [...data.blocks].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <>
      <Helmet>
        <title>{title} | ONE PIECE</title>
      </Helmet>

      <div className="page-header py-14">
        <div className="container-op text-center">
          <h1 className="font-display font-black text-4xl md:text-5xl text-white">
            {title}
          </h1>
        </div>
      </div>

      <main className="container-op py-10 md:py-14 max-w-4xl mx-auto">
        {blocks.length > 0 ? (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <CMSBlock key={`${block.type}-${index}`} block={block} />
            ))}
          </div>
        ) : data?.content ? (
          <article
            className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-brand-900 prose-a:text-brand-600"
            dangerouslySetInnerHTML={{
              __html: data.content,
            }}
          />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Content coming soon</p>
          </div>
        )}
      </main>
    </>
  );
}
