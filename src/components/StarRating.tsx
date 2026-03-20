import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRate?: (value: number) => void;
  size?: number;
}

const StarRating = ({ rating, onRate, size = 18 }: StarRatingProps) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onRate}
          onClick={() => onRate?.(star)}
          className={`transition-transform duration-100 ${onRate ? "cursor-pointer active:scale-90" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={
              star <= rating
                ? "fill-star-filled text-star-filled"
                : "fill-star-empty text-star-empty"
            }
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
