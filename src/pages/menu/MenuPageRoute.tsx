import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useVendor } from '@/contexts/VendorContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeLoading } from '@/components/ui/welcome-loading';
import MenuPage from './MenuPage';

/**
 * Route wrapper for /menu/:vendorIdentifier (username or phone).
 * When the logged-in vendor is viewing their own menu, shows the panel
 * (sidebar + header) and a back button to dashboard. Otherwise renders
 * the public menu only.
 */
export default function MenuPageRoute() {
  const { vendorPhone: vendorIdentifier } = useParams<{ vendorPhone: string }>();
  const { user, loading: authLoading } = useAuth();
  const { vendor, loading: vendorLoading } = useVendor();

  const loading = authLoading || vendorLoading;
  const isOwnMenu = !!(
    user &&
    vendor &&
    (vendor.username === vendorIdentifier || vendor.phone === vendorIdentifier)
  );

  if (loading) {
    return <WelcomeLoading />;
  }

  if (isOwnMenu) {
    return (
      <DashboardLayout>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground gap-1.5"
            asChild
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to panel
            </Link>
          </Button>
        </div>
        <MenuPage />
      </DashboardLayout>
    );
  }

  return <MenuPage />;
}
