import { useState, useEffect, useRef, useCallback } from 'react';
import GifCard from '../components/GifCard.js';
import GifPreviewModal from '../components/GifPreviewModal.js';
import api from '../services/api.js';
import { Post, PaginatedResult } from '../types/index.js';
import { useParams } from 'react-router-dom';
import '../styles/app.css';

export default function SharedTimeline() {
  const { token } = useParams<{ token: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string) => {
    if (loading || !token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { take: '20' };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get<PaginatedResult<Post>>(`/shares/${token}`, { params });
      setPosts((prev) => cursor ? [...prev, ...data.data] : data.data);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { status?: number } }).response;
        if (resp?.status === 410) setError('This share link has expired.');
        else if (resp?.status === 404) setError('Share link not found.');
        else setError('Failed to load timeline.');
      } else {
        setError('Failed to load timeline.');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, token]);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && nextCursor) {
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, nextCursor, fetchPosts]);

  return (
    <>
      <nav className="navbar navbar-dark bg-primary sticky-top">
        <div className="container">
          <span className="navbar-brand fw-bold">🎭 GIF-Mood</span>
          <span className="text-white-50 small">Shared Timeline</span>
        </div>
      </nav>

      <main className="container py-4">
        {error ? (
          <div className="text-center py-5">
            <div className="display-1">😕</div>
            <h3 className="mt-3">{error}</h3>
            <p className="text-muted">This timeline is no longer accessible.</p>
          </div>
        ) : (
          <>
            {posts.length === 0 && !loading && (
              <div className="text-center text-muted py-5">
                <div className="display-1">🎭</div>
                <p className="lead mt-3">Nothing posted yet.</p>
              </div>
            )}
            <div className="timeline-grid">
              {posts.map((post) => (
                <GifCard key={post.id} post={post} onOpenPreview={setPreviewPost} />
              ))}
            </div>
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
              </div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
          </>
        )}
      </main>

      <GifPreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />
    </>
  );
}
