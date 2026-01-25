import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface MultiFormRowProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel?: string;
  minItems?: number;
}

export function MultiFormRow<T>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Add Row',
  minItems = 1,
}: MultiFormRowProps<T>) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        // Use item.id if available, otherwise fall back to index
        const itemKey = (item as any)?.id || `item-${index}`;
        return (
        <div key={itemKey} className="relative p-4 border border-border rounded-lg bg-accent/30">
          <div className="pr-10">
            {renderItem(item, index)}
          </div>
          {items.length > minItems && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addLabel}
      </Button>
    </div>
  );
}
