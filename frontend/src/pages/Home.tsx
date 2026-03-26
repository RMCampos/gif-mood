import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar.js';
import GifCard from '../components/GifCard.js';
import PostModal from '../components/PostModal.js';
import api from '../services/api.js';
import { Post, PaginatedResult } from '../types/index.js';
import '../styles/app.css';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { take: '20' };
      if (cursor) params.cursor = cursor;
      const { data } = await api.get<PaginatedResult<Post>>('/posts/me', { params });
      setPosts((prev) => cursor ? [...prev, ...data.data] : data.data);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // fail silently; keep existing posts
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll sentinel
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

  function handlePostCreated() {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts();
  }

  return (
    <>
      <Navbar />
      <main className="container py-4">
        {posts.length === 0 && !loading && (
          <div className="text-center text-muted py-5">
            <div className="display-1">🎭</div>
            <p className="lead mt-3">Your timeline is empty. Post your first GIF!</p>
          </div>
        )}
        <div className="timeline-grid">
          {posts.map((post) => (
            <GifCard key={post.id} post={post} />
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
      </main>

      {/* FAB */}
      <button
        className="fab btn btn-primary"
        onClick={() => setShowModal(true)}
        aria-label="Post a GIF"
        title="Post a GIF"
      >
        +
      </button>

      <PostModal show={showModal} onClose={() => setShowModal(false)} onCreated={handlePostCreated} />
    </>
  );
}
