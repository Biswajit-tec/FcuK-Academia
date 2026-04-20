import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function FacultyDetailLoading() {
  return (
    <div className="min-h-screen relative pb-32 text-[var(--text)] font-[var(--font-body)] overflow-x-hidden">
      {/* Background - exactly matches FacultyDetailClient */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute inset-0 rmf-bg-base" />
        <div className="absolute top-[5%] left-[-15%] w-[80%] h-[80%] rounded-full rmf-bg-bloom-top" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full rmf-bg-bloom-bottom" />
        {/* noiseSvg removed — SVG feTurbulence filter is expensive on mobile */}
      </div>

      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
            <ArrowLeft size={18} className="text-[var(--text)] opacity-40" />
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="font-[var(--font-headline)] font-bold tracking-tight text-base text-[var(--text)] opacity-30 uppercase tracking-widest">
            Faculty Detailing
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Profile Card Skeleton */}
        <div className="relative bg-[var(--surface-soft)] border border-white/10 rounded-[2rem] p-6 sm:p-8 mb-10 h-64 sm:h-52 animate-pulse overflow-hidden">
           <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-x-10 sm:grid-cols-2 bg-[var(--surface-soft)] rounded-[2rem] p-6 sm:p-8 border border-white/5 mb-10 h-96 sm:h-80 animate-pulse relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />
        </div>

        {/* Reviews Section Skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-48 rounded-lg bg-[var(--surface-soft)] animate-pulse mb-6" />
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="p-6 bg-[var(--surface-soft)] border border-white/5 rounded-[1.5rem] h-32 animate-pulse" 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
