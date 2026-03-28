import { useEmoji } from '../hooks/useEmoji.js';

interface PlaceholderCardProps {
  onPost: () => void;
}

export default function PlaceholderCard({ onPost }: PlaceholderCardProps) {
  const { emoji } = useEmoji();
  return (
    <button
      type="button"
      className="card shadow-sm overflow-hidden gif-card placeholder-card btn p-0 w-100 text-start border-0"
      onClick={onPost}
      aria-label="Post a GIF to express your mood"
    >
      <div className="gif-card__image-wrapper placeholder-card__image-wrapper d-flex flex-column align-items-center justify-content-center text-center">
        <div className="placeholder-card__icon">{emoji}</div>
        <p className="placeholder-card__message">What GIF best describes your mood?</p>
      </div>
    </button>
  );
}
