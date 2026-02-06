import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, MoreVertical, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface PremiumTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  /** When provided and on mobile, card click calls this instead of onRowClick (e.g. to open action modal). */
  onMobileCardClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  actions?: {
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    custom?: (item: T) => ReactNode;
  };
  mobileCard?: (item: T, index: number) => ReactNode;
  showSerialNumber?: boolean;
  stickyHeader?: boolean;
  className?: string;
}

export function PremiumTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  onRowClick,
  onMobileCardClick,
  emptyMessage = 'No data found',
  emptyIcon,
  actions,
  mobileCard,
  showSerialNumber = false,
  stickyHeader = false,
  className,
}: PremiumTableProps<T>) {
  const isMobile = useIsMobile();
  const safeData = data || [];

  // Add serial number column if needed
  const finalColumns = showSerialNumber
    ? [
        {
          key: '_sn',
          label: 'S.N',
          className: 'w-12',
          render: (_: T, index: number) => (
            <span className="text-muted-foreground font-medium">{index + 1}</span>
          ),
        },
        ...columns,
      ]
    : columns;

  // Filter columns for mobile
  const visibleColumns = isMobile
    ? finalColumns.filter((col) => !col.hideOnMobile)
    : finalColumns;

  // Check if we have actions
  const hasActions = actions && (actions.onView || actions.onEdit || actions.onDelete || actions.custom);

  if (loading) {
    if (isMobile && mobileCard) {
      return (
        <div className={cn('space-y-3', className)}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="glass-card rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
        <Table>
          <TableHeader>
            <TableRow className="bg-accent/50 hover:bg-accent/50">
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn('font-semibold text-foreground', col.className)}
                >
                  {col.label}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-24 text-right font-semibold text-foreground">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-5 w-full max-w-[120px]" />
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!safeData || safeData.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-12 text-center', className)}>
        {emptyIcon && <div className="mb-4 flex justify-center">{emptyIcon}</div>}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view - full-width cards with glassmorphism
  if (isMobile && mobileCard) {
    const handleCardClick = onMobileCardClick ?? onRowClick;
    return (
      <div className={cn('space-y-2 md:space-y-3 w-full', className)}>
        {safeData.map((item, index) => (
          <Card
            key={item.id}
            className={cn(
              'overflow-hidden transition-all duration-200 w-full touch-target min-h-[44px] glass-card rounded-2xl',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              handleCardClick && 'cursor-pointer active:scale-[0.99]'
            )}
            onClick={() => handleCardClick?.(item)}
          >
            {mobileCard(item, index)}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        stickyHeader && 'max-h-[70vh] overflow-auto',
        className
      )}
    >
      <Table>
        <TableHeader className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <TableRow className="bg-accent/50 hover:bg-accent/50">
            {visibleColumns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  'font-semibold text-foreground whitespace-nowrap',
                  col.className,
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.label}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="w-28 text-right font-semibold text-foreground">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeData.map((item, index) => (
            <TableRow
              key={item.id}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-accent/30'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {visibleColumns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    col.className,
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render
                    ? col.render(item, index)
                    : (item as Record<string, unknown>)[col.key] as ReactNode}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <TableActions item={item} actions={actions} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Table actions component
function TableActions<T>({
  item,
  actions,
}: {
  item: T;
  actions: PremiumTableProps<T>['actions'];
}) {
  if (!actions) return null;

  const { onView, onEdit, onDelete, custom } = actions;

  // If we have custom actions, render those
  if (custom) {
    return <>{custom(item)}</>;
  }

  // Desktop: show buttons inline
  const actionCount = [onView, onEdit, onDelete].filter(Boolean).length;

  if (actionCount <= 2) {
    return (
      <div className="flex items-center justify-end gap-1">
        {onView && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => onEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // More than 2 actions: use dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={() => onView(item)}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(item)} className="text-amber-600 focus:text-amber-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(item)}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile card template components
export function MobileCardHeader({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {children}
      {onClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </div>
  );
}

export function MobileCardContent({ children }: { children: ReactNode }) {
  return <div className="px-4 pb-4 pt-0">{children}</div>;
}

export function MobileCardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3 bg-accent/30 border-t border-border">
      {children}
    </div>
  );
}

export function MobileCardRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between py-1.5', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
