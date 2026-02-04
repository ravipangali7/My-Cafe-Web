import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Receipt, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
];

export function BottomNavigation() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  if (!isMobile) {
    return null;
  }

  // For superusers, show Settings; for vendors, show Profile
  const profileOrSettings = user?.is_superuser
    ? { path: '/settings', label: 'Settings', icon: Settings }
    : { path: '/profile', label: 'Profile', icon: User };

  const navItems = [...baseNavItems, profileOrSettings];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-sm safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-14 min-h-[56px] md:h-16 md:min-h-[64px] px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 md:gap-1 flex-1 h-full transition-colors rounded-lg',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn('h-4 w-4 md:h-5 md:w-5', isActive && 'text-primary drop-shadow-sm')} />
              <span className={cn('text-[10px] md:text-xs', isActive && 'font-semibold text-primary')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
