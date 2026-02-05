import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WelcomeLoading } from "@/components/ui/welcome-loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VendorProvider } from "@/contexts/VendorContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OTPVerification from "./pages/OTPVerification";
import ResetPassword from "./pages/ResetPassword";

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
import LiveOrders from "./pages/orders/LiveOrders";
import OrderAlertPage from "./pages/orders/OrderAlertPage";

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
import KYCViewPage from "./pages/kyc/KYCViewPage";
import KYCDocumentPage from "./pages/kyc/KYCDocumentPage";

// Subscription
import SubscriptionPlans from "./pages/subscription/SubscriptionPlans";
import SubscriptionDetails from "./pages/subscription/SubscriptionDetails";

// QR Stand Orders
import QRStandOrdersList from "./pages/qr-stands/QRStandOrdersList";
import QRStandOrderForm from "./pages/qr-stands/QRStandOrderForm";
import QRStandOrderView from "./pages/qr-stands/QRStandOrderView";

// Shareholders, Withdrawals, Dues
import ShareholdersList from "./pages/shareholders/ShareholdersList";
import ShareholderView from "./pages/shareholders/ShareholderView";
import WithdrawalsList from "./pages/withdrawals/WithdrawalsList";
import WithdrawalView from "./pages/withdrawals/WithdrawalView";
import DuesList from "./pages/dues/DuesList";
import DueView from "./pages/dues/DueView";
import PayDues from "./pages/dues/PayDues";

// Customers
import CustomersList from "./pages/customers/CustomersList";

// WhatsApp Notifications
import WhatsAppNotificationsList from "./pages/whatsapp-notifications/WhatsAppNotificationsList";
import WhatsAppNotificationCreate from "./pages/whatsapp-notifications/WhatsAppNotificationCreate";
import WhatsAppNotificationView from "./pages/whatsapp-notifications/WhatsAppNotificationView";

// Payment
import PaymentStatus from "./pages/payment/PaymentStatus";

// Menu (public)
import MenuPage from "./pages/menu/MenuPage";

// QR page (public - no auth)
import QRPage from "./pages/qr/QRPage";

// Public Invoice page (no auth)
import PublicInvoicePage from "./pages/invoices/PublicInvoicePage";

import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

declare global {
  interface Window {
    __handleFlutterBack?: () => void;
    RequestExit?: { postMessage: (msg: string) => void };
    openOrderDetail?: (orderId: string) => void;
    handleIncomingOrderAction?: (orderId: string, action: "accepted" | "rejected") => Promise<void>;
    StopOrderAlertSound?: { postMessage: (msg: string) => void };
    __INCOMING_ORDER__?: {
      order_id: string;
      name?: string;
      table_no?: string;
      phone?: string;
      total?: string;
      items_count?: string;
      items?: string;
    };
  }
}

/** Registers back handler for Flutter WebView: on Login or Dashboard show exit dialog; on other pages navigate back. */
function FlutterBackHandler() {
  const registered = useRef(false);
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    window.__handleFlutterBack = function () {
      const pathname = window.location.pathname;
      const isLoginOrDashboard = pathname === '/login' || pathname === '/' || pathname === '/dashboard';
      if (isLoginOrDashboard) {
        if (window.RequestExit?.postMessage) window.RequestExit.postMessage("");
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        if (window.RequestExit?.postMessage) window.RequestExit.postMessage("");
      }
    };
  }, []);
  return null;
}

/** Exposes openOrderDetail for Flutter: when user accepts incoming order, Flutter calls this to navigate to order detail. */
function OpenOrderDetailHandler() {
  const navigate = useNavigate();
  const registered = useRef(false);
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    window.openOrderDetail = (orderId: string) => {
      if (orderId) navigate(`/orders/${orderId}`);
    };
  }, [navigate]);
  return null;
}

/** Exposes handleIncomingOrderAction for Flutter: Flutter passes accept/reject; React calls API and navigates on accept. */
function HandleIncomingOrderActionHandler() {
  const navigate = useNavigate();
  const registered = useRef(false);
  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    window.handleIncomingOrderAction = async (orderId: string, action: "accepted" | "rejected") => {
      if (!orderId) return;
      const formData = new FormData();
      formData.append("status", action);
      try {
        const response = await api.post(`/api/orders/${orderId}/edit/`, formData, true);
        if (response.error) {
          toast.error("Failed to update order status");
        } else {
          if (action === "accepted") {
            toast.success("Order accepted");
            navigate(`/orders/${orderId}`);
          } else {
            toast.success("Order rejected");
          }
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to update order");
      }
    };
  }, [navigate]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<string | null>(null);
  const [isSubscriptionFeeEnabled, setIsSubscriptionFeeEnabled] = useState<boolean>(true);
  const [isDueBlocked, setIsDueBlocked] = useState<boolean>(false);
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
          const subResponse = await api.get<{ subscription_state: string; is_subscription_fee?: boolean }>('/api/subscription/status/');
          if (!subResponse.error && subResponse.data) {
            setSubscriptionState(subResponse.data.subscription_state);
            // Set whether subscription fee is enabled from backend settings
            setIsSubscriptionFeeEnabled(subResponse.data.is_subscription_fee ?? true);
            
            // If subscription is valid, check due status
            const subState = subResponse.data.subscription_state;
            const subFeeEnabled = subResponse.data.is_subscription_fee ?? true;
            const needsSubscription = subFeeEnabled && (subState === 'no_subscription' || subState === 'expired');
            
            if (!needsSubscription) {
              // Check due threshold status
              const dueResponse = await api.get<{ due_balance: number; due_threshold: number; is_blocked: boolean }>('/api/dues/status/');
              if (!dueResponse.error && dueResponse.data) {
                setIsDueBlocked(dueResponse.data.is_blocked);
              }
            }
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
    return <WelcomeLoading />;
  }

  // Never redirect to login for public invoice path (defensive: invoice route is already outside ProtectedRoute)
  if (!user) {
    if (location.pathname.startsWith('/invoice/public')) {
      return <>{children}</>;
    }
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

  // Check subscription status - only if subscription fee is enabled
  // If is_subscription_fee is false, skip subscription check entirely
  if (isSubscriptionFeeEnabled && kycStatus === 'approved' && subscriptionState) {
    if ((subscriptionState === 'no_subscription' || subscriptionState === 'expired') && location.pathname !== '/subscription' && location.pathname !== '/subscription/details') {
      return <Navigate to="/subscription" replace />;
    }
    // Allow access for active subscriptions or inactive_with_date (user needs to contact admin)
  }

  // Check due threshold - if blocked, redirect to pay-dues page
  if (isDueBlocked && location.pathname !== '/pay-dues') {
    return <Navigate to="/pay-dues" replace />;
  }

  return <VendorProvider>{children}</VendorProvider>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <WelcomeLoading />;
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
          <FlutterBackHandler />
          <OpenOrderDetailHandler />
          <HandleIncomingOrderActionHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/verify-otp" element={<PublicRoute><OTPVerification /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/menu/:vendorPhone" element={<MenuPage />} />
            <Route path="/qr/:vendorPhone" element={<QRPage />} />
            <Route path="/invoice/public/:orderId/:token" element={<PublicInvoicePage />} />

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
            <Route path="/live-orders" element={<ProtectedRoute><LiveOrders /></ProtectedRoute>} />
            <Route path="/order-alert" element={<ProtectedRoute><OrderAlertPage /></ProtectedRoute>} />

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
            <Route path="/kyc-management/:id" element={<ProtectedRoute><KYCViewPage /></ProtectedRoute>} />
            <Route path="/kyc-management/:id/document" element={<ProtectedRoute><KYCDocumentPage /></ProtectedRoute>} />

            {/* Subscription */}
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
            <Route path="/subscription/details" element={<ProtectedRoute><SubscriptionDetails /></ProtectedRoute>} />

            {/* QR Stand Orders */}
            <Route path="/qr-stands" element={<ProtectedRoute><QRStandOrdersList /></ProtectedRoute>} />
            <Route path="/qr-stands/new" element={<ProtectedRoute><QRStandOrderForm /></ProtectedRoute>} />
            <Route path="/qr-stands/:id" element={<ProtectedRoute><QRStandOrderView /></ProtectedRoute>} />

            {/* Shareholders, Withdrawals, Dues */}
            <Route path="/shareholders" element={<ProtectedRoute><ShareholdersList /></ProtectedRoute>} />
            <Route path="/shareholders/:id" element={<ProtectedRoute><ShareholderView /></ProtectedRoute>} />
            <Route path="/withdrawals" element={<ProtectedRoute><WithdrawalsList /></ProtectedRoute>} />
            <Route path="/withdrawals/:id" element={<ProtectedRoute><WithdrawalView /></ProtectedRoute>} />
            <Route path="/dues" element={<ProtectedRoute><DuesList /></ProtectedRoute>} />
            <Route path="/dues/:id" element={<ProtectedRoute><DueView /></ProtectedRoute>} />
            <Route path="/pay-dues" element={<ProtectedRoute><PayDues /></ProtectedRoute>} />

            {/* Customers */}
            <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />

            {/* WhatsApp Notifications */}
            <Route path="/whatsapp-notifications" element={<ProtectedRoute><WhatsAppNotificationsList /></ProtectedRoute>} />
            <Route path="/whatsapp-notifications/new" element={<ProtectedRoute><WhatsAppNotificationCreate /></ProtectedRoute>} />
            <Route path="/whatsapp-notifications/:id" element={<ProtectedRoute><WhatsAppNotificationView /></ProtectedRoute>} />

            {/* Payment (public - for payment callbacks) */}
            <Route path="/payment/status/:txnId" element={<PaymentStatus />} />
            <Route path="/payment/status" element={<PaymentStatus />} />
            <Route path="/payment/callback" element={<PaymentStatus />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
