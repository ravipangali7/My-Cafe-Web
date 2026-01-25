import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { CafeReport } from './CafeReport';
import { OrderReport } from './OrderReport';
import { ProductReport } from './ProductReport';
import { FinanceReport } from './FinanceReport';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('cafe');

  return (
    <DashboardLayout>
      <PageHeader 
        title="Reports"
        description="Generate and view detailed reports"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cafe">Cafe Report</TabsTrigger>
          <TabsTrigger value="orders">Order Report</TabsTrigger>
          <TabsTrigger value="products">Product Report</TabsTrigger>
          <TabsTrigger value="finance">Finance Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cafe">
          <CafeReport />
        </TabsContent>
        
        <TabsContent value="orders">
          <OrderReport />
        </TabsContent>
        
        <TabsContent value="products">
          <ProductReport />
        </TabsContent>
        
        <TabsContent value="finance">
          <FinanceReport />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
