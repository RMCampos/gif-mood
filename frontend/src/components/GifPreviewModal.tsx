import { useEffect } from 'react';
import { format } from 'date-fns';
import { Post } from '../types/index.js';
import { resolveMediaUrl } from '../utils/media.js';

interface GifPreviewModalProps {
  post: Post | null;
  onClose: () => void;
}

export default function GifPreviewModal({ post, onClose }: GifPreviewModalProps) {
  useEffect(() => {
    if (!post) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [post, onClose]);

  if (!post) return null;

  const gifSrc = resolveMediaUrl(post.gifUrl);
  const fullDate = format(new Date(post.createdAt), 'PPPp');

  return (
    <div
      className="modal show d-block gif-preview-modal"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="GIF preview"
    >
      <div className="modal-dialog modal-dialog-centered gif-preview-dialog">
        <div className="modal-content gif-preview-content">
          <div className="modal-header border-0 pb-1">
            <small className="text-muted">Posted {fullDate}</small>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close preview" />
          </div>
          <div className="modal-body pt-0 text-center">
            <img src={gifSrc} alt="Large GIF preview" className="gif-preview-image" />
          </div>
        </div>
      </div>
    </div>
  );
}
