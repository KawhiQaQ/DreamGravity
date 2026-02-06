import { ClarityRating as ClarityRatingType } from '../../../../shared/types/dream';

interface ClarityRatingProps {
  value: ClarityRatingType;
  onChange: (rating: ClarityRatingType) => void;
  error?: string;
}

export function ClarityRating({ value, onChange, error }: ClarityRatingProps) {
  const ratings: ClarityRatingType[] = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dream-text">
        清晰度评分 <span className="text-dream-neon-pink">*</span>
      </label>
      <div className="flex items-center gap-1">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`
              text-3xl transition-all duration-300 hover:scale-125
              ${rating <= value 
                ? 'text-dream-neon-orange drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]' 
                : 'text-white/20 hover:text-white/40'
              }
            `}
            aria-label={`${rating}星`}
          >
            ★
          </button>
        ))}
        <span className="ml-3 text-sm text-dream-text-secondary">
          {value === 1 && '模糊'}
          {value === 2 && '较模糊'}
          {value === 3 && '一般'}
          {value === 4 && '较清晰'}
          {value === 5 && '非常清晰'}
        </span>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
