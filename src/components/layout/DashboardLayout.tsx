import { ReactNode, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Users2,
  UserRoundSearch,
  Scale, 
  FolderOpen, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  QrCode,
  ShieldCheck,
  Radio,
  Banknote,
  Wallet,
  MessageCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useVendor } from '@/contexts/VendorContext';
import { cn } from '@/lib/utils';
import { BottomNavigation } from './BottomNavigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
}

const transactionsSubItems = [
  { path: '/transactions', label: 'All' },
  { path: '/transactions?transaction_type=in', label: 'Income' },
  { path: '/transactions?transaction_type=out', label: 'Outgoing' },
];

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, superuserOnly: false },
  { path: '/vendors', label: 'Vendors', icon: Users, superuserOnly: false },
  { path: '/units', label: 'Units', icon: Scale, superuserOnly: false },
  { path: '/categories', label: 'Categories', icon: FolderOpen, superuserOnly: false },
  { path: '/products', label: 'Products', icon: Package, superuserOnly: false },
  { path: '/customers', label: 'Customers', icon: UserRoundSearch, superuserOnly: false },
  { path: '/orders', label: 'Orders', icon: ShoppingCart, superuserOnly: false },
  { path: '/qr-stands', label: 'QR Stand Orders', icon: QrCode, superuserOnly: false },
  { path: '/transactions', label: 'Transactions', icon: Receipt, superuserOnly: false, children: transactionsSubItems },
  { path: '/whatsapp-notifications', label: 'WhatsApp Notifications', icon: MessageCircle, superuserOnly: false },
  { path: '/reports', label: 'Reports', icon: FileText, superuserOnly: false },
  { path: '/shareholders', label: 'Shareholders', icon: Users2, superuserOnly: true },
  { path: '/withdrawals', label: 'Withdrawals', icon: Banknote, superuserOnly: true },
  { path: '/dues', label: 'Dues', icon: Wallet, superuserOnly: true },
  { path: '/kyc-management', label: 'KYC Management', icon: ShieldCheck, superuserOnly: true },
  { path: '/settings', label: 'Settings', icon: Settings, superuserOnly: true },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionsExpanded, setTransactionsExpanded] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { vendor } = useVendor();
  const isMobile = useIsMobile();

  // Keep Transactions expanded when on transactions page
  const isOnTransactions = location.pathname === '/transactions';
  const showTransactionsSub = transactionsExpanded || isOnTransactions;

  // Filter nav items based on superuser status
  const navItems = useMemo(() => {
    return allNavItems.filter(item => {
      if (item.superuserOnly) {
        return user?.is_superuser === true;
      }
      return true;
    });
  }, [user?.is_superuser]);

  const handleSignOut = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out",
        isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo.png" alt="My Cafe" className="h-9 w-auto" />
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const hasChildren = 'children' in item && item.children && item.children.length > 0;
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              if (hasChildren && item.children) {
                const subItems = item.children as { path: string; label: string }[];
                return (
                  <div key={item.path}>
                    <button
                      type="button"
                      onClick={() => setTransactionsExpanded(!showTransactionsSub)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                      {showTransactionsSub ? (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                    {showTransactionsSub && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
                        {subItems.map((sub) => {
                          const subTo = sub.path.includes('?') 
                            ? { pathname: '/transactions', search: sub.path.split('?')[1] ? `?${sub.path.split('?')[1]}` : '' } 
                            : sub.path;
                          const currentFull = location.pathname + (location.search || '');
                          const subActive = currentFull === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={subTo}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center py-2 px-2 rounded-md text-sm transition-colors",
                                subActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            {vendor && (
              <div className="mb-3 px-2">
                <p className="text-sm font-medium text-foreground truncate">{vendor.name}</p>
                <p className="text-xs text-muted-foreground truncate">{vendor.phone}</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-200",
        isMobile ? "pl-0" : "lg:pl-64"
      )}>
        {/* Top bar - safe area and slightly taller on mobile for app feel */}
        <header className={cn(
          "sticky top-0 z-30 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6",
          isMobile ? "h-20" : "h-16"
        )}>
          <div className="flex items-center">
            {isMobile && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Link to="/dashboard" className="flex items-center ml-2">
                  <img src="/logo.png" alt="My Cafe" className="h-8 w-auto" />
                </Link>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live Order Button - Only for vendors (non-superusers) */}
            {!user?.is_superuser && (
              <Link to="/live-orders">
                <Button variant="default" size="sm" className="gap-2">
                  <Radio className="h-4 w-4" />
                  <span className="hidden sm:inline">Live Order</span>
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Page content - bottom padding for bottom nav + safe area on mobile */}
        <main className={cn(
          "p-4 lg:p-6",
          isMobile && "pb-24 safe-area-bottom"
        )}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />
    </div>
  );
}
