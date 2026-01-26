import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
}

interface QRStandOrder {
  id: number;
  vendor: number;
  vendor_info?: Vendor | null;
  quantity: number;
  total_price: string;
  order_status: string;
  payment_status: string;
}

export default function QRStandOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const isCreateMode = !id || id === 'new';
  const isEditMode = !isCreateMode;

  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [quantity, setQuantity] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchVendors = useCallback(async () => {
    try {
      const response = await api.get<{ vendors: Vendor[] } | { data: Vendor[] }>('/api/vendors/');
      if (response.error || !response.data) {
        return;
      }
      // Handle paginated response
      const vendorsData = (response.data as any).vendors || (response.data as any).data || [];
      setVendors(vendorsData);
      
      // If not superuser, set current user as vendor
      if (!user?.is_superuser && user) {
        setVendorId(user.id);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  }, [user]);

  const fetchOrder = useCallback(async () => {
    if (!user || isCreateMode) {
      setFetching(false);
      return;
    }
    
    try {
      const response = await api.get<{ order: QRStandOrder }>(`/api/qr-stands/orders/${id}/`);
      if (response.error || !response.data) {
        toast.error('Failed to fetch order');
        navigate('/qr-stands');
        return;
      }
      
      const order = response.data.order;
      setVendorId(order.vendor);
      setQuantity(String(order.quantity));
      setTotalPrice(order.total_price);
      setOrderStatus(order.order_status);
      setPaymentStatus(order.payment_status);
    } catch (error) {
      toast.error('Failed to fetch order');
      navigate('/qr-stands');
    } finally {
      setFetching(false);
    }
  }, [user, id, isCreateMode, navigate]);

  useEffect(() => {
    if (user) {
      fetchVendors();
      if (isEditMode) {
        fetchOrder();
      } else {
        setFetching(false);
      }
    }
  }, [user, isEditMode, fetchVendors, fetchOrder]);

  // Calculate total price when quantity changes
  useEffect(() => {
    if (quantity && !isEditMode) {
      // Fetch price per QR stand from settings
      api.get('/api/settings/').then((response) => {
        if (response.data?.setting?.per_qr_stand_price) {
          const pricePerStand = response.data.setting.per_qr_stand_price;
          const total = parseInt(quantity) * pricePerStand;
          setTotalPrice(total.toFixed(2));
        }
      });
    }
  }, [quantity, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    if (!quantity || parseInt(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);

    try {
      if (isCreateMode) {
        const response = await api.post('/api/qr-stands/orders/create/', {
          vendor_id: vendorId,
          quantity: parseInt(quantity),
        });

        if (response.error) {
          toast.error(response.error || 'Failed to create order');
        } else {
          toast.success('Order created successfully');
          navigate('/qr-stands');
        }
      } else {
        const response = await api.put(`/api/qr-stands/orders/${id}/update/`, {
          quantity: parseInt(quantity),
          order_status: orderStatus,
          payment_status: paymentStatus,
        });

        if (response.error) {
          toast.error(response.error || 'Failed to update order');
        } else {
          toast.success('Order updated successfully');
          navigate('/qr-stands');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout>
        <PageHeader title="Loading..." backLink="/qr-stands" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={isCreateMode ? 'Create QR Stand Order' : 'Edit QR Stand Order'}
        backLink="/qr-stands"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{isCreateMode ? 'New QR Stand Order' : 'Edit Order'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {user?.is_superuser && (
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select
                  value={vendorId?.toString() || ''}
                  onValueChange={(value) => setVendorId(parseInt(value))}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name} ({vendor.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive integers
                  if (value === '' || /^\d+$/.test(value)) {
                    setQuantity(value);
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrice">Total Price</Label>
              <Input
                id="totalPrice"
                type="text"
                value={`₹${totalPrice || '0.00'}`}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {isCreateMode ? 'Price is calculated automatically based on quantity' : 'Price is calculated automatically'}
              </p>
            </div>

            {isEditMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="orderStatus">Order Status</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="saved">Saved</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isCreateMode ? 'Create Order' : 'Update Order'}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/qr-stands')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
