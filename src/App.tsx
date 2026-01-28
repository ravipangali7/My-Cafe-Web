import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VendorProvider } from "@/contexts/VendorContext";
import { api } from "@/lib/api";

// Auth pages
import Login from "./pages/Login";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Vendors
import VendorsList from "./pages/vendors/VendorsList";
import VendorView from "./pages/vendors/VendorView";
import VendorForm from "./pages/vendors/VendorForm";

// Units
import UnitsList from "./pages/units/UnitsList";
import UnitView from "./pages/units/UnitView";
import UnitForm from "./pages/units/UnitForm";

// Categories
import CategoriesList from "./pages/categories/CategoriesList";
import CategoryView from "./pages/categories/CategoryView";
import CategoryForm from "./pages/categories/CategoryForm";

// Products
import ProductsList from "./pages/products/ProductsList";
import ProductView from "./pages/products/ProductView";
import ProductForm from "./pages/products/ProductForm";

// Orders
import OrdersList from "./pages/orders/OrdersList";
import OrderView from "./pages/orders/OrderView";
import OrderForm from "./pages/orders/OrderForm";

// Transactions
import TransactionsList from "./pages/transactions/TransactionsList";
import TransactionView from "./pages/transactions/TransactionView";

// Settings
import Settings from "./pages/Settings";

// Profile
import Profile from "./pages/Profile";

// Reports
import ReportsPage from "./pages/reports/ReportsPage";

// KYC
import KYCVerification from "./pages/kyc/KYCVerification";
import KYCManagement from "./pages/kyc/KYCManagement";

// Subscription
import SubscriptionPlans from "./pages/subscription/SubscriptionPlans";

// QR Stand Orders
import QRStandOrdersList from "./pages/qr-stands/QRStandOrdersList";
import QRStandOrderForm from "./pages/qr-stands/QRStandOrderForm";
import QRStandOrderView from "./pages/qr-stands/QRStandOrderView";

// Menu (public)
import MenuPage from "./pages/menu/MenuPage";

import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || loading) {
        setChecking(false);
        return;
      }

      // Skip checks for superusers
      if (user.is_superuser) {
        setChecking(false);
        return;
      }

      try {
        // Check KYC status
        const kycResponse = await api.get<{ kyc_status: string }>('/api/kyc/status/');
        if (!kycResponse.error && kycResponse.data) {
          setKycStatus(kycResponse.data.kyc_status);
          
          // If KYC not approved, redirect will happen below
          if (kycResponse.data.kyc_status !== 'approved') {
            setChecking(false);
            return;
          }

          // Check subscription status if KYC is approved
          const subResponse = await api.get<{ subscription_state: string }>('/api/subscription/status/');
          if (!subResponse.error && subResponse.data) {
            setSubscriptionState(subResponse.data.subscription_state);
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Skip checks for superusers
  if (user.is_superuser) {
    return <VendorProvider>{children}</VendorProvider>;
  }

  // Check KYC status - allow access to /kyc route even if not approved
  if (kycStatus !== 'approved' && kycStatus !== null && location.pathname !== '/kyc') {
    return <Navigate to="/kyc" replace />;
  }

  // Check subscription status - allow access to /subscription route even if not active
  if (kycStatus === 'approved' && subscriptionState) {
    if ((subscriptionState === 'no_subscription' || subscriptionState === 'expired') && location.pathname !== '/subscription') {
      return <Navigate to="/subscription" replace />;
    }
    // Allow access for active subscriptions or inactive_with_date (user needs to contact admin)
  }

  return <VendorProvider>{children}</VendorProvider>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/menu/:vendorPhone" element={<MenuPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Vendors */}
            <Route path="/vendors" element={<ProtectedRoute><VendorsList /></ProtectedRoute>} />
            <Route path="/vendors/new" element={<ProtectedRoute><VendorForm /></ProtectedRoute>} />
            <Route path="/vendors/:id" element={<ProtectedRoute><VendorView /></ProtectedRoute>} />
            <Route path="/vendors/:id/edit" element={<ProtectedRoute><VendorForm /></ProtectedRoute>} />

            {/* Units */}
            <Route path="/units" element={<ProtectedRoute><UnitsList /></ProtectedRoute>} />
            <Route path="/units/new" element={<ProtectedRoute><UnitForm /></ProtectedRoute>} />
            <Route path="/units/:id" element={<ProtectedRoute><UnitView /></ProtectedRoute>} />
            <Route path="/units/:id/edit" element={<ProtectedRoute><UnitForm /></ProtectedRoute>} />

            {/* Categories */}
            <Route path="/categories" element={<ProtectedRoute><CategoriesList /></ProtectedRoute>} />
            <Route path="/categories/new" element={<ProtectedRoute><CategoryForm /></ProtectedRoute>} />
            <Route path="/categories/:id" element={<ProtectedRoute><CategoryView /></ProtectedRoute>} />
            <Route path="/categories/:id/edit" element={<ProtectedRoute><CategoryForm /></ProtectedRoute>} />

            {/* Products */}
            <Route path="/products" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
            <Route path="/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
            <Route path="/products/:id" element={<ProtectedRoute><ProductView /></ProtectedRoute>} />
            <Route path="/products/:id/edit" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />

            {/* Orders */}
            <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderView /></ProtectedRoute>} />
            <Route path="/orders/:id/edit" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />

            {/* Transactions */}
            <Route path="/transactions" element={<ProtectedRoute><TransactionsList /></ProtectedRoute>} />
            <Route path="/transactions/:id" element={<ProtectedRoute><TransactionView /></ProtectedRoute>} />

            {/* Settings */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Reports */}
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            {/* KYC */}
            <Route path="/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
            <Route path="/kyc-management" element={<ProtectedRoute><KYCManagement /></ProtectedRoute>} />

            {/* Subscription */}
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />

            {/* QR Stand Orders */}
            <Route path="/qr-stands" element={<ProtectedRoute><QRStandOrdersList /></ProtectedRoute>} />
            <Route path="/qr-stands/new" element={<ProtectedRoute><QRStandOrderForm /></ProtectedRoute>} />
            <Route path="/qr-stands/:id" element={<ProtectedRoute><QRStandOrderView /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
