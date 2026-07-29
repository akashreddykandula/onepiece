import { motion } from 'framer-motion'

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-10 h-10 border-2 border-brand-200 border-t-brand-800 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <p className="text-xs text-gray-400 tracking-widest uppercase font-sans">Loading…</p>
    </div>
  )
}

export function SkeletonBox({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100">
      <SkeletonBox className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonBox className="h-3 w-1/3" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-2/3" />
        <SkeletonBox className="h-5 w-1/3 mt-2" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}
