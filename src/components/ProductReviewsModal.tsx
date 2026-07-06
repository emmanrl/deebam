import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Product } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface Review {
  id: number;
  productId: number;
  buyerUid: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductReviewsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  product,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Load reviews for the product
  const loadReviews = async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        setError('Failed to load reviews for this product.');
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Could not connect to review service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      loadReviews();
      setRating(5);
      setComment('');
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Thank you! Your review has been posted successfully.');
        setComment('');
        setRating(5);
        await loadReviews();
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        setError(data.error || 'Failed to submit review. Try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="reviews-modal-overlay">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-scale-up flex flex-col max-h-[90vh]" id="reviews-modal-card">
        
        {/* Header */}
        <div className="bg-earth-green-500 p-5 text-white flex justify-between items-center flex-shrink-0" id="reviews-modal-header">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5 text-warm-gold-500" />
            <div>
              <span className="text-[10px] uppercase font-bold text-warm-gold-500 tracking-widest block">Customer Reviews</span>
              <h3 className="font-display font-bold text-sm sm:text-base leading-tight truncate max-w-[280px]">
                {product.name}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-earth-green-600 transition-colors text-white cursor-pointer"
            id="reviews-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow" id="reviews-modal-body">
          {/* Summary Stats */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between" id="reviews-summary-card">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Overall Rating</span>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-2xl text-slate-800">
                  {averageRating || 'N/A'}
                </span>
                <div className="flex text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${
                        averageRating && star <= Math.round(parseFloat(averageRating))
                          ? 'fill-amber-500 stroke-amber-500'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Ratings</span>
              <span className="font-display font-extrabold text-slate-700 text-sm">{reviews.length} reviews</span>
            </div>
          </div>

          {/* Form to Write a Review */}
          {user ? (
            <div className="border border-slate-200 p-5 rounded-2xl space-y-3 bg-white" id="write-review-section">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Have you bought this? Leave your review</h4>
              
              <form onSubmit={handleSubmitReview} className="space-y-3">
                {/* Clickable Star Rating Selector */}
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-slate-500 font-semibold mr-2">Your Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star 
                        className={`h-5 w-5 ${
                          star <= (hoverRating ?? rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment Text */}
                <div>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell other buyers about this grocery product's fresh quality, authentic flavor, traditional uses, or packaging..."
                    rows={3}
                    maxLength={300}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 text-right block mt-1 font-medium">
                    {comment.length}/300 characters
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start space-x-2.5 text-amber-800 text-xs font-semibold leading-relaxed">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>Please sign in with your customer account to leave comments or ratings on products you have previously purchased.</span>
            </div>
          )}

          {/* Feedback Success/Error messages */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-600 text-xs rounded-xl font-semibold flex items-start space-x-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-150 text-rose-600 text-xs rounded-xl font-semibold flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Existing Reviews List */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
              Customer Feedbacks ({reviews.length})
            </h4>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-earth-green-500" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">
                No reviews yet. Be the first previous buyer to write a review!
              </p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5" id={`review-item-${rev.id}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{rev.buyerName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${star <= rev.rating ? 'fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 font-medium">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
