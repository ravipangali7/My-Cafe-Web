import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { getFirebaseMessaging } from '@/lib/firebase-config';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { CategoryPills } from './components/CategoryPills';
import { ProductCard } from './components/ProductCard';
import { OrderPanel } from './components/OrderPanel';
import { cn } from '@/lib/utils';

interface ProductVariant {
  id: number;
  unit_id: number;
  unit_name: string;
  unit_symbol: string;
  price: string;
  discount_type: string | null;
  discount_value: string | null;
  discounted_price: string;
}

interface Product {
  id: number;
  name: string;
  type: string;
  image_url: string | null;
  variants: ProductVariant[];
}

interface Category {
  id: number;
  name: string;
  image_url: string | null;
  products: Product[];
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
}

interface MenuData {
  vendor: Vendor;
  categories: Category[];
}

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export default function MenuPage() {
  const { vendorPhone } = useParams<{ vendorPhone: string }>();
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [transactionFee, setTransactionFee] = useState<number>(0);

  // Fetch settings for transaction fee (public endpoint - no auth required)
  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get<{ setting: { per_transaction_fee?: number } | null }>('/api/settings/public/');
      if (response.data?.setting?.per_transaction_fee) {
        setTransactionFee(response.data.setting.per_transaction_fee);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    if (!vendorPhone) {
      toast.error('Vendor phone is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<MenuData>(`/api/menu/${vendorPhone}/`);
      if (response.error) {
        toast.error(response.error || 'Failed to load menu');
      } else if (response.data) {
        setMenuData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [vendorPhone]);

  useEffect(() => {
    fetchMenu();
    fetchSettings();
  }, [fetchMenu, fetchSettings]);

  // Set up foreground message handler for FCM notifications
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          toast.info(title || 'New Notification', {
            description: body || '',
            duration: 5000,
          });
          
          if (Notification.permission === 'granted') {
            new Notification(title || 'New Notification', {
              body: body || '',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: payload.data?.order_id || 'notification',
              data: payload.data || {},
            });
          }
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, []);

  const addToCart = (product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.variant.id === variant.id
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, variant, quantity: 1 }];
    });
    toast.success('Added to cart');
  };

  const updateQuantity = (productId: number, variantId: number, delta: number) => {
    setCart((prev) => {
      const item = prev.find(
        (item) => item.product.id === productId && item.variant.id === variantId
      );
      if (!item) return prev;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(
          (item) => !(item.product.id === productId && item.variant.id === variantId)
        );
      }

      return prev.map((item) =>
        item.product.id === productId && item.variant.id === variantId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const removeFromCart = (productId: number, variantId: number) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.variant.id === variantId)
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.variant.discounted_price || item.variant.price);
      return sum + price * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleVariantSelect = (productId: number, variantId: number) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  // Get all products or filter by category and search
  const getFilteredProducts = () => {
    if (!menuData) return [];
    
    let products: Product[];
    
    if (activeCategory === 'all') {
      products = menuData.categories.flatMap(cat => cat.products);
    } else {
      const category = menuData.categories.find(cat => cat.id.toString() === activeCategory);
      products = category ? category.products : [];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Find categories that match the search query
      const matchingCategoryIds = menuData.categories
        .filter(cat => cat.name.toLowerCase().includes(query))
        .map(cat => cat.id);
      
      // Get all products from matching categories
      const productsFromMatchingCategories = menuData.categories
        .filter(cat => matchingCategoryIds.includes(cat.id))
        .flatMap(cat => cat.products);
      
      // Filter products by name
      const productsMatchingName = products.filter(p => 
        p.name.toLowerCase().includes(query)
      );
      
      // Combine both results and remove duplicates
      const combinedProducts = [...productsMatchingName];
      productsFromMatchingCategories.forEach(p => {
        if (!combinedProducts.find(existing => existing.id === p.id)) {
          combinedProducts.push(p);
        }
      });
      
      products = combinedProducts;
    }

    return products;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral-50 to-coral-100">
        <div className="animate-pulse text-coral-500 font-medium">Loading menu...</div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coral-50 to-coral-100">
        <div className="text-red-500 font-medium">Menu not found</div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-50 via-white to-coral-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-coral-100 p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo and Vendor Info */}
          <div className="flex items-center gap-3">
            {menuData.vendor.logo_url && (
              <img
                src={menuData.vendor.logo_url}
                alt={menuData.vendor.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-coral-200"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {menuData.vendor.name}
              </h1>
              <p className="text-sm text-gray-500">Our Menu</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search Categories or Menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:border-coral-300 focus:ring-coral-200 rounded-xl"
              />
            </div>
          </div>

          {/* Mobile Cart Button */}
          {cart.length > 0 && (
            <Button
              onClick={() => setShowMobileCart(true)}
              className="lg:hidden bg-coral-500 hover:bg-coral-600 text-white rounded-full px-4"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              ({getCartItemCount()})
            </Button>
          )}
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Categories or Menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:border-coral-300 focus:ring-coral-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 flex gap-6">
        {/* Left Panel - Categories & Products */}
        <div className="flex-1 min-w-0">
          {/* Category Pills */}
          <CategoryPills
            categories={menuData.categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No menu items found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  onAddToCart={addToCart}
                  selectedVariants={selectedVariants}
                  onVariantSelect={handleVariantSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Order Panel (Desktop) */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-24">
            <OrderPanel
              cart={cart}
              vendorPhone={vendorPhone || ''}
              vendor={menuData.vendor}
              onOrderPlaced={() => {
                setCart([]);
              }}
              onUpdateQuantity={updateQuantity}
              onRemoveFromCart={removeFromCart}
              total={calculateTotal()}
              transactionFee={transactionFee}
            />
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
          <Button
            size="lg"
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-coral-500 hover:bg-coral-600 text-white rounded-full shadow-lg shadow-coral-500/30 h-14 text-base font-bold"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({getCartItemCount()} items) - ₹{(calculateTotal() + transactionFee).toFixed(2)}
          </Button>
        </div>
      )}

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          
          {/* Cart Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-3xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            <div className="px-4 pb-6">
              <OrderPanel
                cart={cart}
                vendorPhone={vendorPhone || ''}
                vendor={menuData.vendor}
                onOrderPlaced={() => {
                  setCart([]);
                  setShowMobileCart(false);
                }}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                total={calculateTotal()}
                transactionFee={transactionFee}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
