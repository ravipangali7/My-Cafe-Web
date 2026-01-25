import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { MultiFormRow } from '@/components/forms/MultiFormRow';
import { api } from '@/lib/api';
import { useVendor } from '@/contexts/VendorContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  product_variants: {
    id: string;
    price: number;
    unit: { name: string; symbol: string } | null;
  }[];
}

interface OrderItemInput {
  id?: string; // Add unique ID for React keys
  product_id: string;
  product_variant_id: string;
  quantity: string;
  price: string;
}

interface OrderVariantInfo {
  [productId: string]: {
    [variantId: string]: {
      id: string;
      price: number;
      unit: { name: string; symbol: string } | null;
    };
  };
}

const emptyItem: OrderItemInput = {
  id: undefined,
  product_id: '',
  product_variant_id: '',
  quantity: '1',
  price: '0',
};

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendor } = useVendor();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [status, setStatus] = useState<string>('pending');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [items, setItems] = useState<OrderItemInput[]>([{ ...emptyItem }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderVariants, setOrderVariants] = useState<OrderVariantInfo>({});

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get<{ data: any[] }>('/api/products/');
      if (response.data && response.data.data) {
        const activeProducts = response.data.data
          .filter((p: any) => p.is_active)
          .map((p: any) => ({
            id: String(p.id),
            name: p.name,
            product_variants: (p.variants || []).map((v: any) => ({
              id: String(v.id),
              price: Number(v.price),
              unit: { name: v.unit_name, symbol: v.unit_symbol },
            })),
          }));
        setProducts(activeProducts as Product[]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  }, []);

  const [orderData, setOrderData] = useState<any>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    
    const response = await api.get<{ order: any }>(`/api/orders/${id}/`);
    if (response.error || !response.data) {
      toast.error('Order not found');
      navigate('/orders');
    } else {
      setOrderData(response.data.order);
    }
  }, [id, navigate]);

  // Load products and order data
  useEffect(() => {
    if (vendor) {
      fetchProducts();
      if (isEdit) {
        fetchOrder();
      }
    }
  }, [vendor, isEdit, fetchProducts, fetchOrder]);

  // Set order form data once products are loaded (for edit mode)
  useEffect(() => {
    if (isEdit && orderData && products.length > 0) {
      setName(orderData.name);
      setPhone(orderData.phone);
      setTableNo(orderData.table_no);
      setStatus(orderData.status);
      setPaymentStatus(orderData.payment_status);
      if (orderData.items?.length) {
        // Store variant info from order for variants that might not be in product list
        const variantMap: OrderVariantInfo = {};
        
        // Map order items and ensure variant IDs are set from the order
        const mappedItems = orderData.items.map((item: any, index: number) => {
          const productId = String(item.product);
          const variantId = String(item.product_variant);
          
          // Always store variant info from order (even if found in product list) for fallback
          if (item.variant_info) {
            // Store variant info (always store for consistency, even if found in product list)
            if (!variantMap[productId]) {
              variantMap[productId] = {};
            }
            variantMap[productId][variantId] = {
              id: variantId,
              price: Number(item.variant_info.price || item.price),
              unit: {
                name: item.variant_info.unit_name || 'Unknown',
                symbol: item.variant_info.unit_symbol || '',
              },
            };
          }
          
          return {
            id: `item-${item.id || index}`, // Add unique ID for React keys
            product_id: productId,
            product_variant_id: variantId, // Always use the variant ID from the order
            quantity: String(item.quantity),
            price: String(item.price),
          };
        });
        
        setOrderVariants(variantMap);
        setItems(mappedItems);
      }
    }
  }, [isEdit, orderData, products]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    const validItems = items.filter((item) => item.product_id && item.product_variant_id && item.quantity);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setLoading(true);
    const total = calculateTotal();

    const orderData = {
      name,
      phone,
      table_no: tableNo,
      status,
      payment_status: paymentStatus,
      total,
      vendor_id: vendor.id,
    };

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('table_no', tableNo);
      formData.append('status', status);
      formData.append('payment_status', paymentStatus);
      formData.append('total', String(total));
      formData.append('items', JSON.stringify(validItems.map((item) => ({
        product_id: parseInt(item.product_id),
        product_variant_id: parseInt(item.product_variant_id),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      }))));

      let response;
      if (isEdit) {
        response = await api.post(`/api/orders/${id}/edit/`, formData, true);
      } else {
        response = await api.post('/api/orders/create/', formData, true);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(isEdit ? 'Order updated' : 'Order created');
      navigate('/orders');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save order');
    }

    setLoading(false);
  };

  const updateItem = (index: number, field: keyof OrderItemInput, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };

        // Auto-set price when variant changes
        if (field === 'product_variant_id') {
          // Try to find variant in products first
          const product = products.find((p) => p.id === item.product_id);
          let variant = product?.product_variants.find((v) => v.id === value);
          
          // If not found in products, check orderVariants
          if (!variant && orderVariants[item.product_id]?.[value]) {
            variant = orderVariants[item.product_id][value];
          }
          
          if (variant) {
            updated.price = String(variant.price);
          }
        }

        // Reset variant when product changes (only if actually changing to a different product)
        if (field === 'product_id' && value !== item.product_id) {
          updated.product_variant_id = '';
          updated.price = '0';
        }

        return updated;
      })
    );
  };

  const getVariantsForProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const productVariants = product?.product_variants || [];
    
    // Merge with order variants if they exist (for variants not in current product list)
    const orderVariantMap = orderVariants[productId] || {};
    const orderVariantList = Object.values(orderVariantMap);
    
    // Combine product variants with order variants, avoiding duplicates
    const allVariants = [...productVariants];
    orderVariantList.forEach((orderVariant) => {
      if (!allVariants.find((v) => v.id === orderVariant.id)) {
        allVariants.push(orderVariant);
      }
    });
    
    return allVariants;
  };

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Edit Order' : 'New Order'} backLink="/orders" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableNo">Table No</Label>
                <Input
                  id="tableNo"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="T1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <div className="text-lg font-semibold">
              Total: ₹{calculateTotal().toFixed(2)}
            </div>
          </CardHeader>
          <CardContent>
            <MultiFormRow
              items={items}
              onAdd={() => setItems([...items, { ...emptyItem, id: `new-${Date.now()}` }])}
              onRemove={(index) => setItems(items.filter((_, i) => i !== index))}
              addLabel="Add Item"
              renderItem={(item, index) => (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select
                      value={item.product_id}
                      onValueChange={(v) => updateItem(index, 'product_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products || []).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <Select
                      value={item.product_variant_id || undefined}
                      onValueChange={(v) => updateItem(index, 'product_variant_id', v)}
                      disabled={!item.product_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const variants = getVariantsForProduct(item.product_id);
                          // Ensure the current variant ID is in the list even if it's not found in products
                          // This handles cases where the variant exists in the order but not in current product list
                          const currentVariantId = item.product_variant_id;
                          const hasCurrentVariant = variants.some(v => v.id === currentVariantId);
                          
                          // If we have a variant ID but it's not in the list, add it from orderVariants
                          if (currentVariantId && !hasCurrentVariant && orderVariants[item.product_id]?.[currentVariantId]) {
                            variants.push(orderVariants[item.product_id][currentVariantId]);
                          }
                          
                          return variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.unit?.name || 'Default'} - ₹{variant.price}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                    />
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/orders')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
