import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 12, md: 16, lg: 20 };
  const px = sizes[size];

  const display = interactive && hovered ? hovered : rating;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => {
        const val = i + 1;
        const filled = val <= Math.floor(display);
        const half = !filled && val - 0.5 <= display;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(val)}
            onMouseEnter={() => interactive && setHovered(val)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              width={px}
              height={px}
              className={filled || half ? 'text-[#D4A017] fill-[#D4A017]' : 'text-gray-300'}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="text-sm font-semibold text-[var(--color-text)] ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
