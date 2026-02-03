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
          <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide gap-1 md:grid md:grid-cols-3 md:overflow-visible md:gap-0">
            <TabsTrigger value="vendor" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Vendor Report</TabsTrigger>
            <TabsTrigger value="finance" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Finance Report</TabsTrigger>
            <TabsTrigger value="shareholder" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Shareholder Report</TabsTrigger>
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
        <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide gap-1 md:grid md:grid-cols-3 md:overflow-visible md:gap-0">
          <TabsTrigger value="customer" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Customer Report</TabsTrigger>
          <TabsTrigger value="orders" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Order Report</TabsTrigger>
          <TabsTrigger value="products" className="flex-shrink-0 min-w-[7rem] md:min-w-0 md:flex-shrink">Product Report</TabsTrigger>
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
