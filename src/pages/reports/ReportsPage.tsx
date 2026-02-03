import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { VendorReport } from './VendorReport';
import { FinanceReport } from './FinanceReport';
import { ShareholderReport } from './ShareholderReport';
import { CustomerReport } from './CustomerReport';
import { OrderReport } from './OrderReport';
import { ProductReport } from './ProductReport';

export default function ReportsPage() {
  const { user } = useAuth();
  const isSuperUser = Boolean(user?.is_superuser);
  const [activeTab, setActiveTab] = useState(isSuperUser ? 'vendor' : 'customer');

  if (isSuperUser) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Reports"
          description="Vendor, Finance, and Shareholder reports"
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vendor">Vendor Report</TabsTrigger>
            <TabsTrigger value="finance">Finance Report</TabsTrigger>
            <TabsTrigger value="shareholder">Shareholder Report</TabsTrigger>
          </TabsList>
          <TabsContent value="vendor">
            <VendorReport />
          </TabsContent>
          <TabsContent value="finance">
            <FinanceReport />
          </TabsContent>
          <TabsContent value="shareholder">
            <ShareholderReport />
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        description="Customer, Order, and Product reports"
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer">Customer Report</TabsTrigger>
          <TabsTrigger value="orders">Order Report</TabsTrigger>
          <TabsTrigger value="products">Product Report</TabsTrigger>
        </TabsList>
        <TabsContent value="customer">
          <CustomerReport />
        </TabsContent>
        <TabsContent value="orders">
          <OrderReport />
        </TabsContent>
        <TabsContent value="products">
          <ProductReport />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
