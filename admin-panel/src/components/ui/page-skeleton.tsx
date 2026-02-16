import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface PageSkeletonProps {
  variant: 'list' | 'dashboard' | 'form' | 'detail';
  rows?: number;
  className?: string;
}

function SkeletonFilterBar() {
  return (
    <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-border/20 p-6 flex flex-col md:flex-row gap-6 items-center">
      <Skeleton className="h-14 flex-1 rounded-2xl" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonListRow() {
  return (
    <div className="flex items-center gap-6 pb-6 border-b border-muted/50 last:border-0 last:pb-0">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
      <Skeleton className="h-8 w-24 rounded-xl" />
      <Skeleton className="h-8 w-16 rounded-xl" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  );
}

function SkeletonListCard() {
  return <Skeleton className="h-48 rounded-[2.5rem] border border-muted/50 shadow-sm" />;
}

function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-8', className)}>
      <SkeletonFilterBar />
      <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-border/20 overflow-hidden">
        <div className="p-8 space-y-6">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonListRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-10', className)}>
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border/20 p-8 shadow-sm">
            <div className="flex items-center gap-5">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Two-column sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border/20 shadow-sm p-8 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
        <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border/20 shadow-sm p-8 space-y-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
      <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] border border-border/20 shadow-xl p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="flex justify-end gap-4 pt-6 border-t border-border">
          <Skeleton className="h-14 w-32 rounded-2xl" />
          <Skeleton className="h-14 w-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-border/20 p-8 space-y-3">
          <Skeleton className="h-10 w-1/3 rounded-xl" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
        <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-border/20 p-8 space-y-3">
          <Skeleton className="h-10 w-1/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-border/20 p-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ variant, rows = 5, className }: PageSkeletonProps) {
  switch (variant) {
    case 'list':
      return <ListSkeleton rows={rows} className={className} />;
    case 'dashboard':
      return <DashboardSkeleton className={className} />;
    case 'form':
      return <FormSkeleton className={className} />;
    case 'detail':
      return <DetailSkeleton className={className} />;
  }
}

export { SkeletonFilterBar, SkeletonListCard, SkeletonListRow };

