import React from 'react';
import { ThumbsUp } from 'lucide-react';
import type { Review } from '../../types';
import StarRating from '../ui/StarRating';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-surface-2)] shrink-0">
          {review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#006A4E] font-bold text-sm bg-[#006A4E]/10">
              {review.userName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--color-text)] text-sm">{review.userName}</p>
            <span className="text-xs text-[var(--color-text-muted)]">
              {new Date(review.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" />
        </div>
      </div>
      {review.title && (
        <p className="font-semibold text-[var(--color-text)] text-sm mb-1">{review.title}</p>
      )}
      <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{review.content}</p>
      <div className="flex items-center gap-2 mt-3">
        <button className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[#006A4E] transition-colors">
          <ThumbsUp size={12} />
          <span>Helpful ({review.helpful})</span>
        </button>
      </div>
    </div>
  );
}
