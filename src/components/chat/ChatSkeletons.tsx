import { Skeleton } from '@/components/ui/skeleton';

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1 p-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageThreadSkeleton() {
  return (
    <div className="flex-1 px-3 md:px-6 py-4 space-y-4" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const mine = i % 2 === 1;
        return (
          <div key={i} className={mine ? 'flex justify-end' : 'flex justify-start'}>
            <Skeleton
              className="h-12 rounded-2xl"
              style={{ width: `${45 + ((i * 13) % 30)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
