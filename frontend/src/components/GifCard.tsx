import { formatDistanceToNow, format } from 'date-fns';
import { Post } from '../types/index.js';
import { resolveMediaUrl } from '../utils/media.js';

interface GifCardProps {
  post: Post;
}

export default function GifCard({ post }: GifCardProps) {
  const date = new Date(post.createdAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, 'PPPp');
  const gifSrc = resolveMediaUrl(post.gifUrl);

  return (
    <div className="card shadow-sm overflow-hidden gif-card">
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
