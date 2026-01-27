import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeCategory, setActiveCategory] = useState<string>('');

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
        if (response.data.categories.length > 0) {
          setActiveCategory(response.data.categories[0].id.toString());
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading menu...</div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive">Menu not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {menuData.vendor.logo_url && (
              <img
                src={menuData.vendor.logo_url}
                alt={menuData.vendor.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{menuData.vendor.name}</h1>
              <p className="text-sm opacity-90">Menu</p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setOrderModalOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({getCartItemCount()})
              <Badge className="ml-2 bg-primary text-primary-foreground">
                ₹{calculateTotal().toFixed(2)}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto p-4 pb-24">
        {menuData.categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No menu items available
          </div>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-6">
              {menuData.categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id.toString()}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {menuData.categories.map((category) => (
              <TabsContent key={category.id} value={category.id.toString()}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {product.image_url && (
                          <div className="aspect-video w-full overflow-hidden bg-accent">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            <Badge
                              variant={product.type === 'veg' ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {product.type === 'veg' ? 'Veg' : 'Non-Veg'}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {product.variants.map((variant) => {
                              const hasDiscount = variant.discount_type && variant.discount_value;
                              const price = parseFloat(variant.discounted_price || variant.price);
                              const originalPrice = parseFloat(variant.price);

                              return (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between p-2 border rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {variant.unit_symbol} - ₹{price.toFixed(2)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-sm text-muted-foreground line-through">
                                          ₹{originalPrice.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(product, variant)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 z-20">
          <Button
            size="lg"
            onClick={() => setOrderModalOpen(true)}
            className="rounded-full shadow-lg h-14 px-6"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Place Order (₹{calculateTotal().toFixed(2)})
          </Button>
        </div>
      )}

      {/* Cart Sidebar / Modal */}
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
