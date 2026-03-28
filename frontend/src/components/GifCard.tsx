import { formatDistanceToNow, format } from 'date-fns';
import type { KeyboardEvent } from 'react';
import { Post } from '../types/index.js';
import { resolveMediaUrl } from '../utils/media.js';

interface GifCardProps {
  post: Post;
  onOpenPreview?: (post: Post) => void;
}

export default function GifCard({ post, onOpenPreview }: GifCardProps) {
  const date = new Date(post.createdAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, 'PPPp');
  const gifSrc = resolveMediaUrl(post.gifUrl);
  const isInteractive = Boolean(onOpenPreview);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onOpenPreview) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenPreview(post);
    }
  }

  return (
    <div
      className={`card shadow-sm overflow-hidden gif-card${isInteractive ? ' gif-card--interactive' : ''}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? () => onOpenPreview?.(post) : undefined}
      onKeyDown={handleKeyDown}
      aria-label={isInteractive ? 'Open GIF preview' : undefined}
    >
      <div className="gif-card__image-wrapper">
        <img
          src={gifSrc}
          alt="mood gif"
          className="gif-card__image"
          loading="lazy"
        />
        <div className="gif-card__date" title={fullDate}>
          <span className="gif-card__time-ago">{timeAgo}</span>
          <span className="gif-card__full-date">{fullDate}</span>
        </div>
      </div>
    </div>
  );
}
