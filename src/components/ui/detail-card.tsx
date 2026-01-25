import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-border last:border-0">
      <dt className="text-sm font-medium text-muted-foreground sm:w-1/3 mb-1 sm:mb-0">
        {label}
      </dt>
      <dd className="text-sm text-foreground sm:w-2/3">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

interface DetailCardProps {
  title: string;
  children: ReactNode;
}

export function DetailCard({ title, children }: DetailCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>{children}</dl>
      </CardContent>
    </Card>
  );
}
