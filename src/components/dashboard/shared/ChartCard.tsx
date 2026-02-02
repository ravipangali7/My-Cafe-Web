import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  loading?: boolean;
  headerAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  minHeight?: number;
}

export function ChartCard({
  title,
  description,
  children,
  loading = false,
  headerAction,
  className,
  contentClassName,
  minHeight = 300,
}: ChartCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', contentClassName)}>
        {loading ? (
          <div 
            className="flex items-center justify-center"
            style={{ minHeight }}
          >
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="flex justify-center gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ minHeight }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Empty state for charts
export function ChartEmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  );
}
