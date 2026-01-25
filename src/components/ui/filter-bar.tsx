import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  userId?: number | null;
  onUserIdChange?: (value: number | null) => void;
  onApply: () => void;
  onClear: () => void;
  showUserFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  userId,
  onUserIdChange,
  onApply,
  onClear,
  showUserFilter = false,
  additionalFilters,
}: FilterBarProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    if (!user?.is_superuser || !showUserFilter) return;
    
    setLoadingUsers(true);
    try {
      const response = await api.get<{ data: Array<{ id: number; name: string; phone: string }> }>('/api/vendors/?page_size=1000');
      if (response.data) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserFilterOpen = () => {
    if (users.length === 0 && !loadingUsers) {
      fetchUsers();
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {showUserFilter && user?.is_superuser && onUserIdChange && (
            <div className="w-full md:w-64">
              <Select
                value={userId ? String(userId) : 'all'}
                onValueChange={(value) => onUserIdChange(value === 'all' ? null : parseInt(value))}
                onOpenChange={handleUserFilterOpen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {(users || []).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {additionalFilters}

          <div className="flex gap-2">
            <Button onClick={onApply} variant="default">
              Apply Filters
            </Button>
            <Button onClick={onClear} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
