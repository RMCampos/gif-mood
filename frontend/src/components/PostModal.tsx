import React, { useState, useRef } from 'react';
import axios from 'axios';
import { GiphyGif, GiphySearchResponse, PostSource } from '../types/index.js';
import api from '../services/api.js';

interface PostModalProps {
  show: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Tab = 'search' | 'url' | 'upload';
const GIPHY_PAGE_SIZE = 24;
const SEARCH_SUBMIT_DEBOUNCE_MS = 450;

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;

  const payload = err.response?.data;
  if (typeof payload !== 'object' || payload === null) return fallback;

  const maybeMessage = (payload as { message?: unknown }).message;
  if (Array.isArray(maybeMessage)) {
    const joined = maybeMessage.filter((item): item is string => typeof item === 'string').join(' ');
    return joined || fallback;
  }

  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage;
  }

  return fallback;
}

export default function PostModal({ show, onClose, onCreated }: PostModalProps) {
  const [tab, setTab] = useState<Tab>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GiphyGif[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [urlValue, setUrlValue] = useState('');
  const [urlError, setUrlError] = useState('');

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastSearchSubmitAtRef = useRef(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searching || loadingMore) return;

    const now = Date.now();
    if (now - lastSearchSubmitAtRef.current < SEARCH_SUBMIT_DEBOUNCE_MS) return;
    lastSearchSubmitAtRef.current = now;

    const submittedQuery = searchQuery.trim();
    if (!submittedQuery) return;
    setSearching(true);
    setError('');
    try {
      const { data } = await api.get<GiphySearchResponse>('/giphy/search', {
        params: { q: submittedQuery, limit: GIPHY_PAGE_SIZE, offset: 0 },
      });
      setSearchResults(data.data);
      setActiveQuery(submittedQuery);
      setTotalResults(data.pagination.total_count);
      setHasMore(data.pagination.offset + data.pagination.count < data.pagination.total_count);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to search GIFs'));
    } finally {
      setSearching(false);
    }
  }

  async function handleLoadMore() {
    if (searching || loadingMore || !hasMore || !activeQuery) return;

    setLoadingMore(true);
    setError('');
    try {
      const nextOffset = searchResults.length;
      const { data } = await api.get<GiphySearchResponse>('/giphy/search', {
        params: { q: activeQuery, limit: GIPHY_PAGE_SIZE, offset: nextOffset },
      });

      setSearchResults((prev) => {
        const existingIds = new Set(prev.map((gif) => gif.id));
        const uniqueIncoming = data.data.filter((gif) => !existingIds.has(gif.id));
        return [...prev, ...uniqueIncoming];
      });
      setTotalResults(data.pagination.total_count);
      setHasMore(data.pagination.offset + data.pagination.count < data.pagination.total_count);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load more GIFs'));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSelectGif(gif: GiphyGif) {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const gifUrl = gif.images.original.url;
      await api.post('/posts', { gifUrl, source: 'SEARCH' satisfies PostSource });
      onCreated();
      handleClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function validateUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'url') {
        if (!validateUrl(urlValue)) { setUrlError('Please enter a valid URL'); setSubmitting(false); return; }
        await api.post('/posts', { gifUrl: urlValue, source: 'URL' satisfies PostSource });
      } else {
        if (!uploadFile) { setError('Please select a file'); setSubmitting(false); return; }
        const form = new FormData();
        form.append('file', uploadFile);
        const { data: uploadData } = await api.post<{ gifUrl: string }>('/uploads', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await api.post('/posts', { gifUrl: uploadData.gifUrl, source: 'UPLOAD' satisfies PostSource });
      }
      onCreated();
      handleClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create post. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setTab('search');
    setSearchQuery('');
    setSearchResults([]);
    setLoadingMore(false);
    setActiveQuery('');
    setTotalResults(0);
    setHasMore(false);
    setUrlValue('');
    setUrlError('');
    setUploadFile(null);
    setError('');
    onClose();
  }

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable post-modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Post a GIF</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              {(['search', 'url', 'upload'] as Tab[]).map((t) => (
                <li className="nav-item" key={t}>
                  <button
                    className={`nav-link${tab === t ? ' active' : ''}`}
                    onClick={() => { setTab(t); setError(''); }}
                  >
                    {t === 'search' ? '🔍 Search GIPHY' : t === 'url' ? '🔗 Paste URL' : '📁 Upload File'}
                  </button>
                </li>
              ))}
            </ul>

            {/* Search Tab */}
            {tab === 'search' && (
              <div>
                <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
                  <input
                    className="form-control"
                    placeholder="Search GIFs…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit" disabled={searching || loadingMore || !searchQuery.trim()}>
                    {searching ? '…' : 'Search'}
                  </button>
                </form>
                <small className="text-muted d-block mb-3">Press Enter to run a new search. Typing only updates the input.</small>
                {searchResults.length > 0 && (
                  <>
                    <div className="giphy-grid">
                      {searchResults.map((gif) => (
                        <div
                          key={gif.id}
                          className="giphy-grid__item"
                          onClick={() => void handleSelectGif(gif)}
                        >
                          <img src={gif.images.fixed_height.url} alt={gif.title} loading="lazy" />
                        </div>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">Showing {searchResults.length} of {totalResults}</small>
                      {hasMore && (
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => void handleLoadMore()}
                          disabled={loadingMore || searching}
                        >
                          {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                      )}
                    </div>
                  </>
                )}
                {!searching && searchResults.length === 0 && activeQuery && (
                  <p className="text-muted mb-0">No results found for "{activeQuery}".</p>
                )}
              </div>
            )}

            {/* URL Tab */}
            {tab === 'url' && (
              <div>
                <label className="form-label">GIF URL</label>
                <input
                  className={`form-control${urlError ? ' is-invalid' : ''}`}
                  type="url"
                  placeholder="https://example.com/animation.gif"
                  value={urlValue}
                  onChange={(e) => { setUrlValue(e.target.value); setUrlError(''); }}
                />
                {urlError && <div className="invalid-feedback">{urlError}</div>}
                {urlValue && validateUrl(urlValue) && (
                  <div className="mt-3 text-center">
                    <img src={urlValue} alt="preview" style={{ maxHeight: 200, borderRadius: '0.5rem' }} />
                  </div>
                )}
              </div>
            )}

            {/* Upload Tab */}
            {tab === 'upload' && (
              <div>
                <label className="form-label">Choose GIF from your device (max 10 MB)</label>
                <input
                  ref={fileRef}
                  className="form-control"
                  type="file"
                  accept="image/gif,image/webp,image/png,image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                {uploadFile && (
                  <div className="mt-3 text-center">
                    <img
                      src={URL.createObjectURL(uploadFile)}
                      alt="preview"
                      style={{ maxHeight: 200, borderRadius: '0.5rem' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </button>
            {tab !== 'search' && (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Posting…' : 'Post GIF'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
