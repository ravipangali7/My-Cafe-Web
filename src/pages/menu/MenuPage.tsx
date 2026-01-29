import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { getFirebaseMessaging } from '@/lib/firebase-config';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { OrderModal } from './components/OrderModal';

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
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

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
  }, [fetchMenu]);

  // Set up foreground message handler for FCM notifications
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        // Show browser notification when app is in foreground
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          // Show toast notification
          toast.info(title || 'New Notification', {
            description: body || '',
            duration: 5000,
          });
          
          // Also show browser notification if permission is granted
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

  // Get all products or filter by category
  const getFilteredProducts = () => {
    if (!menuData) return [];
    
    if (activeCategory === 'all') {
      return menuData.categories.flatMap(cat => cat.products);
    }
    
    const category = menuData.categories.find(cat => cat.id.toString() === activeCategory);
    return category ? category.products : [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-pulse text-zinc-400">Loading menu...</div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="text-red-400">Menu not found</div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {menuData.vendor.logo_url && (
              <img
                src={menuData.vendor.logo_url}
                alt={menuData.vendor.name}
                className="h-14 w-14 rounded-full object-cover border-2 border-orange-500"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                {menuData.vendor.name}
              </h1>
              <p className="text-sm text-zinc-400">Our Menu</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button
              onClick={() => setOrderModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Cart</span> ({getCartItemCount()})
              <span className="ml-2 font-bold">₹{calculateTotal().toFixed(0)}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              All Items
            </button>
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id.toString())}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category.id.toString()
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto p-4 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No menu items available
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              // Get the first variant for display price
              const primaryVariant = product.variants[0];
              const price = primaryVariant
                ? parseFloat(primaryVariant.discounted_price || primaryVariant.price)
                : 0;
              const hasDiscount = primaryVariant?.discount_type && primaryVariant?.discount_value;
              const originalPrice = primaryVariant ? parseFloat(primaryVariant.price) : 0;

              return (
                <div
                  key={product.id}
                  className="bg-zinc-800 rounded-2xl flex overflow-hidden hover:bg-zinc-750 transition-all group"
                >
                  {/* Left: Product Image */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                        <span className="text-zinc-500 text-xs">No Image</span>
                      </div>
                    )}
                    {/* Veg/Non-veg indicator */}
                    <div
                      className={`absolute top-2 left-2 w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                        product.type === 'veg'
                          ? 'border-green-500 bg-white'
                          : 'border-red-500 bg-white'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          product.type === 'veg' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Price Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ₹{price.toFixed(0)}
                        </span>
                        {hasDiscount && (
                          <span className="text-zinc-500 text-sm line-through">
                            ₹{originalPrice.toFixed(0)}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="text-white font-bold text-base sm:text-lg uppercase tracking-wide leading-tight truncate">
                        {product.name}
                      </h3>

                      {/* Variant info */}
                      {primaryVariant && product.variants.length > 1 && (
                        <p className="text-zinc-400 text-xs mt-1">
                          {product.variants.length} variants available
                        </p>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <div className="mt-2">
                      {product.variants.length === 1 ? (
                        <button
                          onClick={() => addToCart(product, primaryVariant)}
                          className="bg-zinc-700 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {product.variants.slice(0, 2).map((variant) => {
                            const variantPrice = parseFloat(
                              variant.discounted_price || variant.price
                            );
                            return (
                              <button
                                key={variant.id}
                                onClick={() => addToCart(product, variant)}
                                className="bg-zinc-700 hover:bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-medium transition-all"
                              >
                                {variant.unit_symbol} ₹{variantPrice.toFixed(0)}
                              </button>
                            );
                          })}
                          {product.variants.length > 2 && (
                            <span className="text-zinc-500 text-xs py-1">
                              +{product.variants.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20 max-w-md mx-auto">
          <Button
            size="lg"
            onClick={() => setOrderModalOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/20 h-14 text-base font-bold"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Place Order ({getCartItemCount()} items) - ₹{calculateTotal().toFixed(0)}
          </Button>
        </div>
      )}

      {/* Order Modal */}
      {orderModalOpen && (
        <OrderModal
          open={orderModalOpen}
          onOpenChange={setOrderModalOpen}
          cart={cart}
          vendorPhone={vendorPhone || ''}
          vendor={menuData.vendor}
          onOrderPlaced={() => {
            setCart([]);
            setOrderModalOpen(false);
          }}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          total={calculateTotal()}
        />
      )}
    </div>
  );
}
