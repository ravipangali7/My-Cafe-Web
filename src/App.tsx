import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VendorProvider } from "@/contexts/VendorContext";

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

// Reports
import ReportsPage from "./pages/reports/ReportsPage";

// Menu (public)
import MenuPage from "./pages/menu/MenuPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

            {/* Reports */}
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
