import { cn } from '@/lib/utils';

interface ProductVariant {
  id: number;
  unit_id: number;
  unit_name: string;
  unit_symbol: string;
  price: string;
  discount_type: string | null;
  discount_value: string | null;
  discounted_price: string;
}

interface Product {
  id: number;
  name: string;
  type: string;
  image_url: string | null;
  variants: ProductVariant[];
}

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface ProductCardProps {
  product: Product;
  cart: CartItem[];
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  selectedVariants: Record<number, number>; // productId -> variantId
  onVariantSelect: (productId: number, variantId: number) => void;
}

// Map variant unit symbols to size labels
function getSizeLabel(symbol: string, index: number, total: number): string {
  const lowerSymbol = symbol.toLowerCase();
  
  // Check for common size indicators
  if (lowerSymbol.includes('small') || lowerSymbol === 's') return 'S';
  if (lowerSymbol.includes('medium') || lowerSymbol === 'm') return 'M';
  if (lowerSymbol.includes('large') || lowerSymbol === 'l') return 'L';
  if (lowerSymbol.includes('xl') || lowerSymbol.includes('extra')) return 'XL';
  
  // If we have exactly 3 variants, map to S, M, L
  if (total === 3) {
    return ['S', 'M', 'L'][index] || symbol;
  }
  
  // If we have exactly 2 variants, map to S, L
  if (total === 2) {
    return ['S', 'L'][index] || symbol;
  }
  
  // Otherwise use the symbol or first letter
  return symbol.length <= 3 ? symbol.toUpperCase() : symbol.charAt(0).toUpperCase();
}

export function ProductCard({
  product,
  cart,
  onAddToCart,
  selectedVariants,
  onVariantSelect,
}: ProductCardProps) {
  const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  
  // Check if this product variant is in the cart
  const cartItem = cart.find(
    item => item.product.id === product.id && item.variant.id === selectedVariantId
  );
  const isInCart = !!cartItem;

  const price = selectedVariant
    ? parseFloat(selectedVariant.discounted_price || selectedVariant.price)
    : 0;
  const originalPrice = selectedVariant ? parseFloat(selectedVariant.price) : 0;
  const hasDiscount = selectedVariant?.discount_type && selectedVariant?.discount_value;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {/* Product Image */}
      <div className="relative mb-3">
        <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-4/5 h-4/5 object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          )}
        </div>
        
        {/* Veg/Non-veg indicator */}
        <div
          className={cn(
            'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center bg-white',
            product.type === 'veg' ? 'border-green-500' : 'border-red-500'
          )}
        >
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              product.type === 'veg' ? 'bg-green-500' : 'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Product Name */}
      <h3 className="font-semibold text-gray-800 text-center mb-1 truncate">
        {product.name}
      </h3>

      {/* Price */}
      <div className="text-center mb-3">
        <span className="text-coral-500 font-bold text-lg">
          ${price.toFixed(2)}
        </span>
        {hasDiscount && (
          <span className="text-gray-400 text-sm line-through ml-2">
            ${originalPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Size Variants */}
      {product.variants.length > 1 && (
        <div className="flex justify-center gap-2 mb-3">
          {product.variants.map((variant, index) => {
            const sizeLabel = getSizeLabel(variant.unit_symbol, index, product.variants.length);
            const isSelected = variant.id === selectedVariantId;
            
            return (
              <button
                key={variant.id}
                onClick={() => onVariantSelect(product.id, variant.id)}
                className={cn(
                  'w-8 h-8 rounded-full text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-coral-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                title={`${variant.unit_name} - $${parseFloat(variant.discounted_price || variant.price).toFixed(2)}`}
              >
                {sizeLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => selectedVariant && onAddToCart(product, selectedVariant)}
        className={cn(
          'w-full py-2 rounded-lg text-sm font-medium transition-all',
          isInCart
            ? 'bg-coral-100 text-coral-600 border border-coral-200'
            : 'bg-coral-500 text-white hover:bg-coral-600'
        )}
      >
        {isInCart ? 'Added' : 'Add'}
      </button>
    </div>
  );
}
