import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  image_url: string | null;
}

interface CategoryPillsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

// Category icons mapping - fallback icons for common category names
const categoryIcons: Record<string, string> = {
  pizza: '🍕',
  burger: '🍔',
  rice: '🍚',
  dessert: '🍰',
  drinks: '🥤',
  coffee: '☕',
  tea: '🍵',
  sandwich: '🥪',
  salad: '🥗',
  soup: '🍲',
  pasta: '🍝',
  noodles: '🍜',
  chicken: '🍗',
  fish: '🐟',
  seafood: '🦐',
  vegetarian: '🥬',
  breakfast: '🍳',
  snacks: '🍿',
  ice_cream: '🍨',
  cake: '🎂',
};

function getCategoryIcon(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return '🍽️'; // Default food icon
}

export function CategoryPills({ categories, activeCategory, onCategoryChange }: CategoryPillsProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Choose Category{' '}
          <span className="text-sm font-normal text-coral-500">{categories.length}+ Category</span>
        </h2>
        <button className="text-coral-500 text-sm font-medium hover:underline">
          View All
        </button>
      </div>
      
      <div className="flex flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {/* All Items pill */}
        <button
          onClick={() => onCategoryChange('all')}
          className={cn(
            'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all border min-w-fit flex-shrink-0',
            activeCategory === 'all'
              ? 'bg-coral-500 text-white border-coral-500 shadow-md shadow-coral-500/20'
              : 'bg-white text-gray-700 border-gray-200 hover:border-coral-300 hover:bg-coral-50'
          )}
        >
          <span className="text-sm sm:text-base">🍽️</span>
          <span>All Items</span>
        </button>

        {/* Category pills */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id.toString())}
            className={cn(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all border min-w-fit flex-shrink-0',
              activeCategory === category.id.toString()
                ? 'bg-coral-500 text-white border-coral-500 shadow-md shadow-coral-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-coral-300 hover:bg-coral-50'
            )}
          >
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm sm:text-base">{getCategoryIcon(category.name)}</span>
            )}
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
