import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface DueBalanceCardProps {
  dueBalance: number;
}

export function DueBalanceCard({ dueBalance }: DueBalanceCardProps) {
  const hasBalance = dueBalance > 0;
  
  return (
    <Card className={hasBalance ? 'border-red-200 bg-red-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasBalance && <AlertTriangle className="h-5 w-5 text-red-500" />}
          Due Balance
        </CardTitle>
        <CardDescription>Outstanding amount to be paid</CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
          ₹{dueBalance.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
