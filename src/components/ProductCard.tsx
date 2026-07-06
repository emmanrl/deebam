import React, { useState } from 'react';
import { ShoppingCart, Plus, Check, Star } from 'lucide-react';
import { Product } from '../types.ts';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  ratingSummary?: { avgRating: number; count: number };
  onOpenReviews: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart,
  ratingSummary,
  onOpenReviews,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div 
      className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full relative"
      id={`product-card-${product.id}`}
    >
      {/* Category and Weight Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5" id={`product-badges-${product.id}`}>
        {product.weightSize && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-earth-green-600 shadow-sm">
            {product.weightSize}
          </span>
        )}
        {isOutOfStock ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
            Out of Stock
          </span>
        ) : product.stockQuantity <= 5 ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm animate-pulse">
            Only {product.stockQuantity} Left!
          </span>
        ) : null}
      </div>

      {/* Product Image */}
      <div className="aspect-square w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
            id={`product-img-${product.id}`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <ShoppingCart className="h-12 w-12 stroke-[1.2]" />
            <span className="text-xs mt-2 font-medium">Deebam Fresh</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent" />
      </div>

      {/* Product Content info */}
      <div className="p-5 flex-1 flex flex-col justify-between" id={`product-info-${product.id}`}>
        <div>
          <span className="text-[11px] font-bold text-warm-gold-600 uppercase tracking-wider block mb-1">
            {product.categoryName || 'General'}
          </span>
          <h3 className="font-display font-bold text-slate-800 text-base leading-snug group-hover:text-earth-green-500 transition-colors duration-200">
            {product.name}
          </h3>

          {/* Reviews Rating Display */}
          <button
            onClick={() => onOpenReviews(product)}
            className="flex items-center space-x-1 mt-1 text-[11px] text-slate-400 hover:text-earth-green-600 transition-colors font-semibold cursor-pointer"
            title="Click to view product reviews"
          >
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-3 w-3 ${
                    ratingSummary && star <= Math.round(ratingSummary.avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span>
              {ratingSummary && ratingSummary.count > 0 
                ? `(${parseFloat(String(ratingSummary.avgRating)).toFixed(1)} / ${ratingSummary.count})`
                : '(No reviews yet)'}
            </span>
          </button>

          {product.description && (
            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Pricing & Add to cart button row */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price</span>
            <span className="font-display font-extrabold text-lg text-earth-green-600">
              £{product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`p-2.5 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-500 text-white scale-105'
                  : 'bg-earth-green-500 text-white hover:bg-earth-green-600 hover:rotate-90 group-hover:scale-105'
            }`}
            id={`add-to-cart-btn-${product.id}`}
            title="Add to Cart"
          >
            {isAdded ? (
              <Check className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
