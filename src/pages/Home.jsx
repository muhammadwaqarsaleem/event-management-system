import { Link } from 'react-router-dom';

/**
 * Home Page Component
 * 
 * Serves as the landing page for EventVerse.
 * Demonstrates:
 * 1. Declarative navigation buttons using React Router's <Link>.
 * 2. Clean, structured presentation welcoming users to the event management system.
 * 3. Highlights key system features (Event Discovery, Easy Booking, Account Management).
 */
function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-pill">
            <span>✨</span> Next-Gen Event Management Platform
          </div>

          <h1 className="hero-title">
            Discover, Plan & Attend Unforgettable Events
          </h1>

          <p className="hero-subtitle">
            Welcome to <strong>EventVerse</strong>! Easily register for exciting workshops,
            tech summits, conferences, and social meetups — or manage your own events seamlessly.
          </p>

          <div className="hero-actions">
            {/* Primary Action Button navigating to Register */}
            <Link to="/register" className="btn-cta-primary">
              Get Started Free →
            </Link>

            {/* Secondary Action Button navigating to Login */}
            <Link to="/login" className="btn-cta-secondary">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="features-section">
        <h2 className="section-title">Everything You Need In One Place</h2>
        <p className="section-subtitle">
          Designed for both attendees and organizers to ensure smooth event experiences.
        </p>

        <div className="feature-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🎯</div>
            <h3 className="feature-title">Explore Events</h3>
            <p className="feature-description">
              Browse through a curated list of upcoming events filtered by category, date, and venue.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">⚡</div>
            <h3 className="feature-title">Fast & Secure Auth</h3>
            <p className="feature-description">
              Register an account in seconds with robust client-side validation and password protection.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🎟️</div>
            <h3 className="feature-title">Instant Registrations</h3>
            <p className="feature-description">
              Reserve tickets, receive notifications, and track your booked events all in one dashboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
