import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType, getDateRange } from '@/components/ui/date-filter-buttons';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CafeReportData {
  summary: {
    total_orders: number;
    total_revenue: string;
    paid_orders: number;
    paid_revenue: string;
    products_count: number;
    categories_count: number;
  };
  orders_by_status: Array<{ status: string; count: number; revenue: string }>;
  orders_by_payment_status: Array<{ payment_status: string; count: number; revenue: string }>;
  top_products: Array<{
    product__name: string;
    product__category__name: string;
    total_revenue: string;
    total_quantity: number;
    order_count: number;
  }>;
  revenue_by_category: Array<{
    product__category__name: string;
    total_revenue: string;
    order_count: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    orders: number;
    revenue: string;
  }>;
  detailed_orders: Array<{
    id: number;
    name: string;
    phone: string;
    table_no: string;
    status: string;
    payment_status: string;
    total: string;
    created_at: string;
  }>;
}

export function CafeReport() {
  const { user } = useAuth();
  
  // Set default dates to last 7 days (including today)
  const getDefaultDates = () => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 6); // 7 days including today
    
    return {
      start: lastWeek.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('week');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<CafeReportData | null>(null);

  const generateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        start_date: startDate,
        end_date: endDate,
      };

      if (appliedUserId && user?.is_superuser) {
        params.user_id = appliedUserId;
      }

      const queryString = api.buildQueryString(params);
      const response = await api.get<CafeReportData>(`/api/reports/cafe${queryString}`);

      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setReportData(response.data);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, appliedUserId, user]);

  const handleApplyFilters = () => {
    setAppliedUserId(userId);
  };

  const handleClearFilters = () => {
    setUserId(null);
    setAppliedUserId(null);
  };

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and filters to generate the report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilter('custom');
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter('custom');
                }}
                required
              />
            </div>
          </div>

          <DateFilterButtons
            activeFilter={dateFilter}
            onFilterChange={handleDateFilterChange}
            showDateInputs={false}
          />

          {user?.is_superuser && (
            <FilterBar
              search=""
              onSearchChange={() => {}}
              userId={userId}
              onUserIdChange={setUserId}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              showUserFilter={true}
            />
          )}

          <Button onClick={generateReport} disabled={loading || !startDate || !endDate}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          {reportData.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{reportData.summary.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.total_revenue || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Orders</p>
                    <p className="text-2xl font-bold">{reportData.summary.paid_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Revenue</p>
                    <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.paid_revenue || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold">{reportData.summary.products_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{reportData.summary.categories_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.orders_by_status && reportData.orders_by_status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Status</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders_by_status.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.status}</td>
                          <td className="p-2 text-right">{item.count}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.revenue || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.orders_by_payment_status && reportData.orders_by_payment_status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orders by Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Payment Status</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders_by_payment_status.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.payment_status}</td>
                          <td className="p-2 text-right">{item.count}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.revenue || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.revenue_by_category && reportData.revenue_by_category.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.revenue_by_category.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.product__category__name || 'Uncategorized'}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.total_revenue || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">{item.order_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.top_products && reportData.top_products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.top_products.map((product, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{product.product__name}</td>
                          <td className="p-2">{product.product__category__name}</td>
                          <td className="p-2 text-right">₹{parseFloat(product.total_revenue || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">{product.total_quantity || 0}</td>
                          <td className="p-2 text-right">{product.order_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.daily_breakdown && reportData.daily_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Orders</th>
                        <th className="text-right p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.daily_breakdown.map((day, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{new Date(day.date).toLocaleDateString()}</td>
                          <td className="p-2 text-right">{day.orders || 0}</td>
                          <td className="p-2 text-right">₹{parseFloat(day.revenue || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.detailed_orders && reportData.detailed_orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Table</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Payment</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detailed_orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-2">#{order.id}</td>
                          <td className="p-2">{order.name}</td>
                          <td className="p-2">{order.table_no}</td>
                          <td className="p-2">{order.status}</td>
                          <td className="p-2">{order.payment_status}</td>
                          <td className="p-2 text-right">₹{parseFloat(order.total || '0').toFixed(2)}</td>
                          <td className="p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
