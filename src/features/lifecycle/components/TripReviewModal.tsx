import React, { useState } from 'react';
import { CheckCircle2, Star, ThumbsUp, X } from 'lucide-react';
import type { ActiveTripData } from '../model/lifecycleTypes';

interface TripReviewModalProps {
  trip: ActiveTripData;
  onClose: () => void;
  onSubmitReview: (rating: number, comment: string, tags: string[]) => void;
}

const COMPLIMENT_TAGS = [
  'Пунктуальність ⏱️',
  'Чистий салон ✨',
  'Безпечне водіння 🛡️',
  'Приємна музика 🎵',
  'Ввічливість 😊',
  'Комфортне авто 🚗',
];

export const TripReviewModal: React.FC<TripReviewModalProps> = ({
  trip,
  onClose,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Пунктуальність ⏱️', 'Чистий салон ✨']);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReview(rating, comment, selectedTags);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-auto rounded-t-[28px] sm:rounded-[28px] bg-white dark:bg-[#0B1730] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 animate-in slide-in-from-bottom-6 duration-300">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-300"
          aria-label="Закрити"
        >
          <X size={17} />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16B87A]">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="mt-3 text-lg font-black text-[#081B35] dark:text-white">
              Поїздку завершено!
            </h3>
            <p className="text-xs font-semibold text-[#63738C] dark:text-slate-400 mt-0.5">
              Як минула поїздка з водієм {trip.driver.name}?
            </p>

            {/* Stars row */}
            <div className="my-4 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition active:scale-125 focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-700'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {/* Compliment Tags */}
            <div className="text-left mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                Що сподобалося найбільше?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMPLIMENT_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                        active
                          ? 'bg-[#EAF3FF] dark:bg-blue-950/80 text-[#0866F5] dark:text-blue-300 border border-[#0866F5]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Додайте кілька слів про поїздку…"
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none"
            />

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-[#0866F5] py-3.5 text-center text-sm font-black text-white shadow-lg shadow-blue-500/25 transition active:scale-98"
            >
              Надіслати відгук
            </button>
          </form>
        ) : (
          <div className="py-6 text-center">
            <ThumbsUp size={40} className="mx-auto text-[#16B87A] animate-bounce" />
            <h4 className="mt-3 text-base font-black text-[#081B35] dark:text-white">
              Дякуємо за відгук!
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Ваша оцінка допомагає іншим пасажирам обирати перевірених водіїв.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
