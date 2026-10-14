import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents } from '../redux/eventsSlice';
import EventCard from '../components/EventCard';

// Available category filters matching Ticketmaster Discovery API segments
const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: '🌟', value: '' },
  { id: 'music', label: 'Music', icon: '🎵', value: 'Music' },
  { id: 'sports', label: 'Sports', icon: '⚽', value: 'Sports' },
  { id: 'arts', label: 'Arts & Theatre', icon: '🎭', value: 'Arts & Theatre' },
];

/**
 * Home Page Component
 * =============================================================================
 * Serves as the landing page for EventVerse.
 * 
 * Features:
 * 1. Fetches real upcoming events anchored to current time via Ticketmaster API.
 * 2. Provides category tabs (All, Music, Sports, Arts & Theatre) for live API filtering.
 * 3. Shows animated loading skeletons during fetches.
 * 4. Displays informative error alerts if rate-limits or network failures occur.
 * 5. Minimal console logging.
 * -----------------------------------------------------------------------------
 */
function Home() {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState('');

  // Extract events state from central Redux store
  const { events, loading, error } = useSelector((state) => state.events);

  // Fetch initial events on mount or when activeCategory changes
  useEffect(() => {
    dispatch(
      getEvents({
        classificationName: activeCategory,
        size: 6,
        sort: 'date,asc',
      })
    )
      .unwrap()
      .then((data) => {
        console.log(`[Home] Loaded ${data?.events?.length || 0} events from Ticketmaster.`);
      })
      .catch((err) => {
        console.warn('[Home] Failed to load events:', err);
      });
  }, [dispatch, activeCategory]);

  // Handler to refresh current events list
  const handleRefreshEvents = () => {
    dispatch(
      getEvents({
        classificationName: activeCategory,
        size: 6,
        sort: 'date,asc',
      })
    );
  };

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
            Welcome to <strong>EventVerse</strong>! Easily register for exciting concerts,
            sports matches, Broadway shows, and conferences — or manage your events seamlessly.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn-cta-primary">
              Get Started Free →
            </Link>
            <Link to="/login" className="btn-cta-secondary">
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Live Events Section */}
      <section className="events-feed-section" id="featured-events">
        <div className="events-feed-header">
          <div>
            <span className="feed-badge">🎟️ Live Discovery</span>
            <h2 className="feed-title">Upcoming Featured Events</h2>
            <p className="feed-subtitle">
              Real-time events curated directly from the Ticketmaster Discovery API.
            </p>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={handleRefreshEvents}
            disabled={loading}
            aria-label="Refresh events feed"
          >
            {loading ? (
              <>
                <span className="spinner-inline" aria-hidden="true" />
                Refreshing...
              </>
            ) : (
              '🔄 Refresh Events'
            )}
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="category-filter-tabs" role="tablist" aria-label="Event Categories">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`category-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.value)}
                disabled={loading}
              >
                <span className="tab-icon" aria-hidden="true">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Informative Error Banner with Rate Limit Warning */}
        {error && (
          <div className="feed-alert feed-alert-error" role="alert">
            <span className="alert-icon" aria-hidden="true">⚠️</span>
            <div className="alert-content">
              <strong>Unable to load events</strong>
              <p>{error}</p>
              <small className="rate-limit-note">
                Note: Ticketmaster API allows 5 requests/sec and 5,000/day. If rate-limited, please wait a few seconds and click "Refresh Events".
              </small>
            </div>
            <button
              type="button"
              className="btn-alert-retry"
              onClick={handleRefreshEvents}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="events-grid" aria-busy="true" aria-label="Loading events">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="event-skeleton-card">
                <div className="skeleton-img shimmer" />
                <div className="skeleton-body">
                  <div className="skeleton-tag shimmer" />
                  <div className="skeleton-title shimmer" />
                  <div className="skeleton-title short shimmer" />
                  <div className="skeleton-line shimmer" />
                  <div className="skeleton-line short shimmer" />
                  <div className="skeleton-footer shimmer" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Events Grid */}
        {!loading && events && events.length > 0 && (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (!events || events.length === 0) && (
          <div className="feed-empty-state">
            <span className="empty-icon" aria-hidden="true">🔍</span>
            <h3>No events found in this category</h3>
            <p>Try selecting "All Events" or click below to reload.</p>
            <button
              type="button"
              className="btn-cta-secondary"
              onClick={() => setActiveCategory('')}
            >
              View All Events
            </button>
          </div>
        )}
      </section>

      {/* Feature Highlights Section */}
      <section className="features-section">
        <h2 className="section-title">Everything You Need In One Place</h2>
        <p className="section-subtitle">
          Designed for both attendees and organizers to ensure smooth event experiences.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">🎯</div>
            <h3 className="feature-title">Explore Events</h3>
            <p className="feature-description">
              Browse through a curated list of upcoming events filtered by category, date, and venue.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">⚡</div>
            <h3 className="feature-title">Fast & Secure Auth</h3>
            <p className="feature-description">
              Register an account in seconds with robust client-side validation and password protection.
            </p>
          </div>

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
