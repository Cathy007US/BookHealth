interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriceTag({ price, originalPrice, size = 'md' }: PriceTagProps) {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size];

  return (
    <div className="flex items-baseline gap-2">
      <span className={`${sizeClass} text-red-500 font-semibold`}>
        ¥{price.toFixed(2)}
      </span>
      {originalPrice && originalPrice > price && (
        <span className="text-xs text-gray-400 line-through">
          ¥{originalPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}
