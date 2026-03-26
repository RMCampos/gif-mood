import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.js';

export default function Landing() {
  return (
    <>
      <Navbar />
      <main className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center px-3">
        <div style={{ maxWidth: 560 }}>
          <div className="display-1 mb-3">🎭</div>
          <h1 className="display-4 fw-bold mb-3">GIF-Mood</h1>
          <p className="lead text-muted mb-5">
            Your private mood timeline — express how you feel, one GIF at a time. No text.
            No noise. Just vibes.
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <Link to="/register" className="btn btn-primary btn-lg px-5">
              Get started
            </Link>
            <Link to="/login" className="btn btn-outline-secondary btn-lg px-5">
              Log in
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
