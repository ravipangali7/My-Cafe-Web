import { useState, useEffect } from 'react';
import { Plus, Minus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface OrderPanelProps {
  cart: CartItem[];
  vendorPhone: string;
  vendor: Vendor;
  onOrderPlaced: () => void;
  onUpdateQuantity: (productId: number, variantId: number, delta: number) => void;
  onRemoveFromCart: (productId: number, variantId: number) => void;
  total: number;
  transactionFee?: number;
}

export function OrderPanel({
  cart,
  vendorPhone,
  vendor,
  onOrderPlaced,
  onUpdateQuantity,
  onRemoveFromCart,
  total,
  transactionFee = 0,
}: OrderPanelProps) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Generate order number for display
  const orderNumber = Math.floor(Math.random() * 900) + 100;
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Calculate totals with transaction fee
  const subtotal = total;
  const grandTotal = total + transactionFee;

  // Request FCM token
  useEffect(() => {
    getFCMTokenOnly()
      .then((token) => {
        if (token) {
          setFcmToken(token);
        }
      })
      .catch((error) => {
        console.error('Failed to get FCM token:', error);
      });
  }, []);

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!guestPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      // Initiate order payment without creating order first. Order is created only on payment success.
      toast.info('Initiating payment...');
      const paymentResult = await initiateOrderPaymentFromPayload({
        name: guestName,
        phone: guestPhone,
        table_no: tableNo || '',
        vendor_phone: vendorPhone,
        total: subtotal.toFixed(2),
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">New Order Bill</h2>
          <span className="text-coral-500 font-medium">Order #{orderNumber}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{currentDate}</p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Your cart is empty</p>
            <p className="text-sm mt-1">Add items to get started</p>
          </div>
        ) : (
          cart.map((item) => {
            const price = parseFloat(item.variant.discounted_price || item.variant.price);
            return (
              <div
                key={`${item.product.id}-${item.variant.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                {/* Product Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800 text-sm truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-coral-500 font-semibold text-sm">
                    ₹{(price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.variant.id, -1)}
                    className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center hover:bg-coral-200 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.variant.id, 1)}
                    className="w-6 h-6 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center hover:bg-coral-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveFromCart(item.product.id, item.variant.id)}
                  className="text-coral-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Price Summary & Form */}
      <div className="p-4 border-t border-gray-100 space-y-4">
        {/* Price Summary */}
        {cart.length > 0 && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {transactionFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service Charge</span>
                <span>₹{transactionFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-coral-500 font-bold text-base">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="guestName" className="text-sm text-gray-600">
              Name <span className="text-coral-500">*</span>
            </Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="guestPhone" className="text-sm text-gray-600">
              Phone <span className="text-coral-500">*</span>
            </Label>
            <Input
              id="guestPhone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tableNo" className="text-sm text-gray-600">
              Table Number <span className="text-gray-400">(Optional)</span>
            </Label>
            <Input
              id="tableNo"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              placeholder="Enter table number"
              className="mt-1"
            />
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          className="w-full bg-coral-500 hover:bg-coral-600 text-white py-3 rounded-xl font-semibold"
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
    </div>
  );
}
