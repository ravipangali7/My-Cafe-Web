import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProductReportData {
  summary: {
    total_products_sold: number;
    total_revenue: string;
    total_quantity: number;
    start_date: string;
    end_date: string;
  };
  products_by_category: Array<{
    product__category__name: string;
    product_count: number;
    total_revenue: string;
    total_quantity: number;
  }>;
  top_products: Array<{
    product__id: number;
    product__name: string;
    product__category__name: string;
    product__type: string;
    total_revenue: string;
    total_quantity: number;
    order_count: number;
    avg_price: string;
  }>;
}

export function ProductReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ProductReportData | null>(null);

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
      const response = await api.get<ProductReportData>(`/api/reports/products/${queryString}`);

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
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Products Sold</p>
                    <p className="text-2xl font-bold">{reportData.summary.total_products_sold || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.total_revenue || '0').toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                    <p className="text-2xl font-bold">{reportData.summary.total_quantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="text-sm">
                      {reportData.summary.start_date && reportData.summary.end_date
                        ? `${new Date(reportData.summary.start_date).toLocaleDateString()} - ${new Date(reportData.summary.end_date).toLocaleDateString()}`
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.products_by_category && reportData.products_by_category.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Products by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Product Count</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.products_by_category.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.product__category__name || 'Uncategorized'}</td>
                          <td className="p-2 text-right">{item.product_count || 0}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.total_revenue || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">{item.total_quantity || 0}</td>
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
                          <td className="p-2">{product.product__name || '—'}</td>
                          <td className="p-2">{product.product__category__name || 'Uncategorized'}</td>
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
        </div>
      )}
    </div>
  );
}
