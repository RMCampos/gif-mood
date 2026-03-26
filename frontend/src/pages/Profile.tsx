import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.js';
import api from '../services/api.js';
import { User, ShareLink } from '../types/index.js';
import axios from 'axios';
import { resolveMediaUrl } from '../utils/media.js';
import '../styles/app.css';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Profile form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  // Picture
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');

  // Share link
  const [expiresAt, setExpiresAt] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, shareRes] = await Promise.all([
          api.get<User>('/users/me'),
          api.get<{ shareLink: ShareLink | null }>('/shares/me'),
        ]);
        setUser(userRes.data);
        setUsername(userRes.data.username);
        setEmail(userRes.data.email);
        setShareLink(shareRes.data.shareLink);
      } finally {
        setLoadingUser(false);
      }
    }
    load();
  }, []);

  async function checkUsernameAvailability(value: string): Promise<void> {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    const currentNormalized = user?.username.trim().toLowerCase() ?? '';

    if (!trimmed || normalized === currentNormalized) {
      setUsernameAvailability('idle');
      setUsernameMessage('');
      return;
    }

    if (normalized.length < 3) {
      setUsernameAvailability('unavailable');
      setUsernameMessage('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z_]+$/.test(normalized)) {
      setUsernameAvailability('unavailable');
      setUsernameMessage('Username can only contain letters (a-z) and underscores');
      return;
    }

    setUsernameAvailability('checking');
    setUsernameMessage('Checking username availability...');

    try {
      const { data } = await api.get<{ available: boolean; message?: string }>('/users/check-username', {
        params: { username: normalized },
      });

      if (normalized !== username.trim().toLowerCase()) {
        return;
      }

      if (data.available) {
        setUsernameAvailability('available');
        setUsernameMessage('Username is available');
      } else {
        setUsernameAvailability('unavailable');
        setUsernameMessage(data.message ?? 'Username is already taken');
      }
    } catch {
      if (normalized === username.trim().toLowerCase()) {
        setUsernameAvailability('idle');
        setUsernameMessage('Could not verify username right now');
      }
    }
  }

  useEffect(() => {
    if (!user) return;

    const timeoutId = window.setTimeout(() => {
      void checkUsernameAvailability(username);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [username, user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (usernameAvailability === 'checking') {
      setProfileError('Please wait for username validation to complete');
      return;
    }

    if (usernameAvailability === 'unavailable') {
      setProfileError(usernameMessage || 'Username is not available');
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await api.patch<User>('/users/me', { username, email });
      setUser(data);
      setProfileSuccess('Profile updated!');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setProfileError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to update'));
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePictureUpload() {
    if (!pictureFile) return;
    setPictureError('');
    setUploadingPicture(true);
    try {
      const form = new FormData();
      form.append('file', pictureFile);
      const { data } = await api.post<{ pictureUrl: string }>('/users/me/picture', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser((u) => u ? { ...u, pictureUrl: data.pictureUrl } : u);
      setPictureFile(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setPictureError(err.response?.data?.message ?? 'Upload failed');
      }
    } finally {
      setUploadingPicture(false);
    }
  }

  async function handleGenerateShare(e: React.FormEvent) {
    e.preventDefault();
    setShareError('');
    setShareLoading(true);
    try {
      const { data } = await api.post<{ shareLink: ShareLink }>('/shares', { expiresAt });
      setShareLink(data.shareLink);
      setExpiresAt('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setShareError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create link'));
      }
    } finally {
      setShareLoading(false);
    }
  }

  async function handleRevokeShare() {
    if (!window.confirm('Are you sure you want to revoke the share link?')) return;
    setShareLoading(true);
    try {
      await api.delete('/shares');
      setShareLink(null);
    } catch {
      setShareError('Failed to revoke');
    } finally {
      setShareLoading(false);
    }
  }

  function handleCopy() {
    if (!shareLink) return;
    const url = `${window.location.origin}/share/${shareLink.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const shareUrl = shareLink ? `${window.location.origin}/share/${shareLink.shareToken}` : '';
  const isExpired = shareLink ? new Date(shareLink.expiresAt) <= new Date() : false;
  const profilePictureSrc = user?.pictureUrl ? resolveMediaUrl(user.pictureUrl) : null;

  if (loadingUser) {
    return (
      <>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container py-4" style={{ maxWidth: 640 }}>
        <h1 className="mb-4 fw-bold">Profile</h1>

        {/* Profile picture */}
        <div className="card mb-4 p-4">
          <h5 className="mb-3">Profile Picture</h5>
          <div className="d-flex align-items-center gap-3 mb-3">
            {profilePictureSrc ? (
              <img
                src={profilePictureSrc}
                alt="profile"
                className="rounded-circle"
                style={{ width: 72, height: 72, objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                style={{ width: 72, height: 72, fontSize: '2rem' }}
              >
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-grow-1">
              <input
                type="file"
                className="form-control form-control-sm"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setPictureFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          {pictureError && <div className="alert alert-danger py-1">{pictureError}</div>}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handlePictureUpload}
            disabled={!pictureFile || uploadingPicture}
          >
            {uploadingPicture ? 'Uploading…' : 'Upload picture'}
          </button>
        </div>

        {/* Profile info */}
        <div className="card mb-4 p-4">
          <h5 className="mb-3">Account Info</h5>
          {profileError && <div className="alert alert-danger py-2">{profileError}</div>}
          {profileSuccess && <div className="alert alert-success py-2">{profileSuccess}</div>}
          <form onSubmit={handleSaveProfile} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={`form-control${usernameAvailability === 'unavailable' ? ' is-invalid' : ''}`}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setProfileError('');
                  setProfileSuccess('');
                }}
                onBlur={() => {
                  void checkUsernameAvailability(username);
                }}
                required
                minLength={3}
                maxLength={30}
              />
              {usernameAvailability !== 'idle' && (
                <div
                  className={`form-text ${
                    usernameAvailability === 'unavailable'
                      ? 'text-danger'
                      : usernameAvailability === 'available'
                        ? 'text-success'
                        : 'text-muted'
                  }`}
                >
                  {usernameMessage}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={savingProfile || usernameAvailability === 'checking' || usernameAvailability === 'unavailable'}
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Share link */}
        <div className="card mb-4 p-4">
          <h5 className="mb-3">Share Timeline</h5>
          {shareError && <div className="alert alert-danger py-2">{shareError}</div>}

          {shareLink ? (
            <div>
              <div className={`alert ${isExpired ? 'alert-warning' : 'alert-info'} py-2`}>
                {isExpired ? '⚠️ This link has expired.' : '✅ Your timeline is currently shared.'}
              </div>
              <div className="mb-2">
                <label className="form-label small text-muted">Share link</label>
                <div className="input-group">
                  <input type="text" className="form-control form-control-sm" value={shareUrl} readOnly />
                  <button className="btn btn-outline-secondary btn-sm" onClick={handleCopy} type="button">
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="small text-muted mb-3">
                Expires: {new Date(shareLink.expiresAt).toLocaleString()}
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleRevokeShare}
                  disabled={shareLoading}
                >
                  Revoke access
                </button>
              </div>
              <hr />
              <p className="small text-muted mb-2">Regenerate with a new expiry:</p>
            </div>
          ) : (
            <p className="text-muted">Your timeline is private. Generate a link to share it temporarily.</p>
          )}

          <form onSubmit={handleGenerateShare} className="d-flex gap-2 align-items-end flex-wrap">
            <div className="flex-grow-1">
              <label className="form-label small" htmlFor="expiresAt">Expires at</label>
              <input
                id="expiresAt"
                type="datetime-local"
                className="form-control form-control-sm"
                value={expiresAt}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                onChange={(e) => setExpiresAt(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={shareLoading || !expiresAt}>
              {shareLoading ? '…' : shareLink ? 'Regenerate' : 'Generate link'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
