import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar } from '@/components/ui/filter-bar';
import { StatsCards } from '@/components/ui/stats-cards';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { api, fetchPaginated } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface VendorCustomer {
  id: number;
  name: string;
  phone: string;
  user: number;
  created_at: string;
  updated_at: string;
}

export default function CustomersList() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<VendorCustomer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      
      if (appliedSearch) {
        params.search = appliedSearch;
      }

      const response = await fetchPaginated<VendorCustomer>('/api/vendor-customers/', params);
      
      if (response.error) {
        toast.error('Failed to fetch customers');
      } else if (response.data) {
        setCustomers(response.data.data);
        setCount(response.data.count);
        setTotalPages(response.data.total_pages);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, appliedSearch]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user, fetchCustomers]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    const response = await api.get(`/api/vendor-customers/${deleteId}/delete/`);

    if (response.error) {
      toast.error('Failed to delete customer');
    } else {
      toast.success('Customer deleted');
      fetchCustomers();
    }
    setDeleteId(null);
  }, [deleteId, fetchCustomers]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setIsFormOpen(true);
  };

  const openEditForm = (customer: VendorCustomer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setIsFormOpen(true);
    setSelectedCustomerId(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }
    
    if (!formPhone.trim()) {
      toast.error('Phone is required');
      return;
    }

    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', formName.trim());
      formData.append('phone', formPhone.trim());

      let response;
      if (editingCustomer) {
        response = await api.post(`/api/vendor-customers/${editingCustomer.id}/edit/`, formData, true);
      } else {
        response = await api.post('/api/vendor-customers/create/', formData, true);
      }

      if (response.error) {
        // Check for duplicate phone error
        if (response.error.includes('already exists')) {
          toast.error('A customer with this phone number already exists');
        } else {
          toast.error(response.error);
        }
      } else {
        toast.success(editingCustomer ? 'Customer updated' : 'Customer created');
        closeForm();
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove any non-digit characters
    return phone.replace(/\D/g, '');
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'phone',
      label: 'Phone',
      render: (item: VendorCustomer) => (
        <a 
          href={`tel:${item.phone}`} 
          className="text-primary hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {item.phone}
        </a>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (item: VendorCustomer) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <a href={`tel:${item.phone}`}>
            <Button variant="ghost" size="icon" title="Call" className="h-8 w-8">
              <Phone className="h-4 w-4 text-blue-600" />
            </Button>
          </a>
          <a 
            href={`https://wa.me/${formatPhoneForWhatsApp(item.phone)}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="icon" title="WhatsApp" className="h-8 w-8">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </Button>
          </a>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Added',
      render: (item: VendorCustomer) => new Date(item.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: VendorCustomer) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            title="Edit"
            onClick={() => openEditForm(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Delete"
            onClick={() => setDeleteId(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const statCards = [
    { label: 'Total Customers', value: count, icon: Users, color: 'text-foreground' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Customers"
        description="Manage your customer contacts"
        action={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        }
      />

      <StatsCards stats={statCards} loading={loading} />
      
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        showUserFilter={false}
        placeholder="Search customers..."
      />

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customers found</div>
          ) : (
            customers.map((customer) => (
              <Card
                key={customer.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base mb-1">{customer.name}</div>
                      <a 
                        href={`tel:${customer.phone}`} 
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {customer.phone}
                      </a>
                      <div className="text-xs text-muted-foreground mt-1">
                        Added {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <a href={`tel:${customer.phone}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </Button>
                      </a>
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(customer.phone)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={customers} 
          loading={loading} 
          emptyMessage="No customers found"
        />
      )}

      {count > pageSize && (
        <div className="mt-4">
          <SimplePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Mobile quick actions dialog */}
      {selectedCustomerId && (() => {
        const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
        if (!selectedCustomer) return null;
        return (
          <Dialog open={!!selectedCustomerId} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedCustomer.name}</DialogTitle>
                <DialogDescription>
                  {selectedCustomer.phone}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <a href={`tel:${selectedCustomer.phone}`} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    Call
                  </Button>
                </a>
                <a 
                  href={`https://wa.me/${formatPhoneForWhatsApp(selectedCustomer.phone)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                    WhatsApp
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => openEditForm(selectedCustomer)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setDeleteId(selectedCustomer.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Create/Edit form dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer details' : 'Add a new customer to your list'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Phone number (e.g., 919876543210)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include country code for WhatsApp (e.g., 91 for India)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
