import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Minus, X, ShoppingCart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getFCMTokenOnly } from '@/lib/fcm';
import { toast } from 'sonner';
import { initiateOrderPaymentFromPayload, redirectToPayment } from '@/services/paymentService';

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

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
}

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  vendorPhone: string;
  vendor: Vendor;
  onOrderPlaced: () => void;
  onUpdateQuantity: (productId: number, variantId: number, delta: number) => void;
  onRemoveFromCart: (productId: number, variantId: number) => void;
  total: number;
}

export function OrderModal({
  open,
  onOpenChange,
  cart,
  vendorPhone,
  vendor,
  onOrderPlaced,
  onUpdateQuantity,
  onRemoveFromCart,
  total,
}: OrderModalProps) {
  const [orderType, setOrderType] = useState<'user' | 'guest'>('guest');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Request FCM token when modal opens (for guest orders, we don't save to user account)
  useEffect(() => {
    if (open) {
      getFCMTokenOnly()
        .then((token) => {
          if (token) {
            setFcmToken(token);
          } else {
            console.warn('FCM token not obtained. Order notifications may not work.');
          }
        })
        .catch((error) => {
          console.error('Failed to get FCM token:', error);
          // Don't block order placement if FCM token fails
        });
    }
  }, [open]);

  const searchUser = async () => {
    if (!userPhone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setSearchingUser(true);
    try {
      const response = await api.get<{ data: Array<{ id: number; name: string; phone: string }> }>(
        `/api/vendors/?search=${userPhone}&page_size=10`
      );
      if (response.data && response.data.data.length > 0) {
        const user = response.data.data.find((u) => u.phone === userPhone);
        if (user) {
          setSelectedUser(user);
          setUserName(user.name);
          toast.success('User found');
        } else {
          toast.error('User not found');
        }
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      toast.error('Failed to search user');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSubmit = async () => {
    const customerName = orderType === 'user' ? userName : guestName;
    const customerPhone = orderType === 'user' ? userPhone : guestPhone;

    if (orderType === 'user') {
      if (!selectedUser) {
        toast.error('Please search and select a user');
        return;
      }
    } else {
      if (!guestName.trim() || !guestPhone.trim()) {
        toast.error('Please enter name and phone for guest order');
        return;
      }
    }

    setSubmitting(true);
    try {
      // Initiate order payment without creating order first. Order is created only on payment success.
      toast.info('Initiating payment...');
      const paymentResult = await initiateOrderPaymentFromPayload({
        name: customerName,
        phone: customerPhone,
        table_no: tableNo?.trim() || '',
        vendor_phone: vendorPhone,
        total: total.toFixed(2),
        items: JSON.stringify(
          cart.map((item) => ({
            product_id: item.product.id,
            product_variant_id: item.variant.id,
            quantity: item.quantity,
            price: item.variant.discounted_price || item.variant.price,
          }))
        ),
        ...(fcmToken ? { fcm_token: fcmToken } : {}),
      });

      if (paymentResult.error) {
        toast.error(paymentResult.error || 'Failed to initiate payment');
        toast.error('Payment is required. Please try again.');
        return;
      }

      if (paymentResult.data?.payment_url) {
        toast.success('Redirecting to payment...');
        redirectToPayment(paymentResult.data.payment_url);
      } else {
        toast.error('Payment URL not received. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Order</DialogTitle>
          <DialogDescription>Review your cart and provide order details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cart Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Cart Items</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.map((item) => {
                const price = parseFloat(item.variant.discounted_price || item.variant.price);
                return (
                  <div key={`${item.product.id}-${item.variant.id}`} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.variant.unit_symbol} × {item.quantity} = ₹{(price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.product.id, item.variant.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateQuantity(item.product.id, item.variant.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveFromCart(item.product.id, item.variant.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Order Type Selection */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value as 'user' | 'guest')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user">I have a user account</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="guest" id="guest" />
                <Label htmlFor="guest">Order as guest</Label>
              </div>
            </RadioGroup>
          </div>

          {/* User Account Form */}
          {orderType === 'user' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userPhone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="userPhone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                  <Button onClick={searchUser} disabled={searchingUser}>
                    {searchingUser ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              {selectedUser && (
                <div className="p-3 border rounded-lg bg-accent">
                  <div className="font-medium">Selected User:</div>
                  <div className="text-sm">{selectedUser.name} - {selectedUser.phone}</div>
                </div>
              )}
            </div>
          )}

          {/* Guest Form */}
          {orderType === 'guest' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Name</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">Phone Number</Label>
                <Input
                  id="guestPhone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          )}

          {/* Table Number (optional) */}
          <div className="space-y-2">
            <Label htmlFor="tableNo">Table Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Input
              id="tableNo"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              placeholder="Enter table number"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Order & Pay'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
