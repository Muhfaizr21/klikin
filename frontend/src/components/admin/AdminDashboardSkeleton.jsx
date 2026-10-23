import React from 'react';

/**
 * AdminDashboardSkeleton
 * High-end shimmering skeleton loader for Super Admin Overview dashboard.
 * Matches exact dimensions, shapes, and colors of metric cards, charts, and tables.
 */
export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 5 Top KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`border rounded-2xl p-4 flex flex-col justify-between shadow-2xs skeleton-shimmer ${
              i === 3
                ? 'bg-[#ede9fe]/50 border-[#ddd6fe]'
                : i === 5
                ? 'bg-[#f0fdf4]/60 border-[#bbf7d0]'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-slate-200/80 rounded-md" />
              <div className="w-4 h-4 bg-slate-200/80 rounded-md" />
            </div>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <div className="h-7 w-24 sm:w-28 bg-slate-200 rounded-lg" />
              <div className="h-5 w-14 bg-slate-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Revenue Categories + Top Tenants Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Revenue by Category (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 skeleton-shimmer">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <div className="h-4 w-48 bg-slate-200 rounded-md" />
              <div className="h-3 w-72 bg-slate-100 rounded-md" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-100" />
          </div>

          <div className="space-y-4 pt-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100" />
                    <div className="h-3 w-36 bg-slate-200 rounded-md" />
                  </div>
                  <div className="h-3 w-16 bg-slate-200 rounded-md" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-200 rounded-full"
                    style={{ width: `${85 - idx * 14}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tenant Performance (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 skeleton-shimmer">
          <div className="pb-4 border-b border-slate-100 space-y-1.5">
            <div className="h-4 w-44 bg-slate-200 rounded-md" />
            <div className="h-3 w-64 bg-slate-100 rounded-md" />
          </div>

          <div className="divide-y divide-slate-50 space-y-3 pt-1">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3 w-32 bg-slate-200 rounded-md" />
                    <div className="h-2.5 w-20 bg-slate-100 rounded-md" />
                  </div>
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full" />
                <div className="h-3 w-8 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="h-9 w-full rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>

      {/* Bottom Section: Funnel + Cohorts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 skeleton-shimmer">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-slate-200 rounded-md" />
              <div className="h-3 w-64 bg-slate-100 rounded-md" />
            </div>
            <div className="h-5 w-44 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {[100, 84, 58, 46, 32, 24].map((width, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-slate-200 rounded-md" />
                  <div className="h-3 w-12 bg-slate-200 rounded-md" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div className="h-full bg-slate-200 rounded-full" style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 skeleton-shimmer">
          <div className="pb-4 border-b border-slate-100 space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 rounded-md" />
            <div className="h-3 w-52 bg-slate-100 rounded-md" />
          </div>
          <div className="grid grid-cols-5 gap-2 pt-2">
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className="space-y-2">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="h-8 rounded-lg bg-slate-100" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Traffic & Behavior Charts Skeleton */}
      <div className="pt-6 border-t border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div className="space-y-1.5">
            <div className="h-4 w-64 bg-slate-200 rounded-md" />
            <div className="h-3 w-96 bg-slate-100 rounded-md" />
          </div>
          <div className="h-6 w-36 bg-slate-100 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((chart) => (
            <div
              key={chart}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 skeleton-shimmer"
            >
              <div className="h-3.5 w-32 bg-slate-200 rounded-md" />
              <div className="h-36 bg-slate-50 rounded-xl flex items-end gap-1.5 p-2">
                {[40, 65, 80, 50, 90, 70, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-200 rounded-t"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
