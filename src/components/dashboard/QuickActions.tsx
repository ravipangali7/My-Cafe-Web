import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Scale,
  FolderOpen,
  ShoppingCart,
  QrCode,
  Receipt,
  FileText,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  superuserOnly?: boolean;
}

const quickActions: QuickAction[] = [
  { label: 'Vendors', icon: Users, path: '/vendors' },
  { label: 'Units', icon: Scale, path: '/units' },
  { label: 'Categories', icon: FolderOpen, path: '/categories' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'QR Stand Orders', icon: QrCode, path: '/qr-stands' },
  { label: 'Transactions', icon: Receipt, path: '/transactions' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'KYC Management', icon: ShieldCheck, path: '/kyc-management', superuserOnly: true },
  { label: 'Settings', icon: Settings, path: '/settings', superuserOnly: true },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredActions = quickActions.filter(
    action => !action.superuserOnly || user?.is_superuser
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant="outline"
                className="h-auto flex-col gap-2 py-4 hover:bg-accent"
                onClick={() => navigate(action.path)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
