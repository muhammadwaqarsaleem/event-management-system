import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents } from '../redux/eventsSlice';
import EventCard from '../components/EventCard';

/**
 * =============================================================================
 * CATEGORY FILTER DEFINITIONS (Matching Ticketmaster Discovery API Segments)
 * =============================================================================
 * Required options: "All", "Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"
 */
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌟', value: '' },
  { id: 'music', label: 'Music', icon: '🎵', value: 'Music' },
  { id: 'sports', label: 'Sports', icon: '⚽', value: 'Sports' },
  { id: 'arts', label: 'Arts & Theatre', icon: '🎭', value: 'Arts & Theatre' },
  { id: 'film', label: 'Film', icon: '🎬', value: 'Film' },
  { id: 'misc', label: 'Miscellaneous', icon: '🎪', value: 'Miscellaneous' },
];

/**
 * =============================================================================
 * SORTING OPTIONS CONFIGURATION
 * =============================================================================
 * Required sorting criteria:
 * 1. "Date (Earliest First)" -> sort='date,asc'
 * 2. "Date (Latest First)"   -> sort='date,desc'
 * 3. "Name (A-Z)"            -> sort='name,asc'
 */
const SORT_OPTIONS = [
  { value: 'date,asc', label: 'Date (Earliest First)' },
  { value: 'date,desc', label: 'Date (Latest First)' },
  { value: 'name,asc', label: 'Name (A-Z)' },
];

// Standard page size for the responsive 3-column event grid
const PAGE_SIZE = 12;

/**
 * Home Page Component
 * =============================================================================
 * Implements Step 5: "Add event listing" with live category filtering, sorting,
 * and Ticketmaster API pagination handling.
 *
 * Architecture & Implementation Highlights:
 * -----------------------------------------------------------------------------
 * 1. Category Filtering Logic:
 *    - Renders interactive pill buttons for "All", "Music", "Sports",
 *      "Arts & Theatre", "Film", and "Miscellaneous".
 *    - Highlights the currently active category pill with an active CSS class.
 *    - Clicking a pill updates the active filter state, dispatches `getEvents` with
 *      the corresponding `classificationName`, and explicitly resets the page to 0.
 *
 * 2. Sorting Dropdown:
 *    - Lets attendees sort events by "Date (Earliest First)", "Date (Latest First)",
 *      or "Name (A-Z)".
 *    - When changed, dispatches `getEvents` with the new sort parameter and resets page to 0.
 *
 * 3. Redux State Selectors (`useSelector`):
 *    - `events`: Array of normalized event objects returned from the Ticketmaster API.
 *    - `loading`: Tracks in-flight API requests to show skeletons and disable buttons.
 *    - `error`: Displays user-friendly error banners and rate-limit mitigation guidance.
 *    - `pageInfo`: Object containing { number, size, totalPages, totalElements }.
 *
 * 4. Ticketmaster API Pagination Handling:
 *    - Ticketmaster Discovery API pagination is 0-indexed (`pageInfo.number` starts at 0).
 *    - Human-readable page display computes `currentPage = pageInfo.number + 1`.
 *    - "Previous" button is disabled on page 0 (`pageInfo.number === 0`).
 *    - "Next" button is disabled on the final page (`currentPage >= totalPages`).
 *    - Ticketmaster API caps deep queries at 1,000 items (page * size < 1000); this
 *      is gracefully guarded to prevent 400 Bad Request responses from the API.
 * -----------------------------------------------------------------------------
 */
function Home() {
  const dispatch = useDispatch();

  // ---------------------------------------------------------------------------
  // LOCAL COMPONENT STATE (Filters, Sorting & Pagination)
  // ---------------------------------------------------------------------------
  const [activeCategory, setActiveCategory] = useState('');
  const [sortOption, setSortOption] = useState('date,asc');
  const [refreshNotification, setRefreshNotification] = useState(false);

  // ---------------------------------------------------------------------------
  // REDUX STORE SELECTORS
  // ---------------------------------------------------------------------------
  /**
   * Access the centralized events slice state:
   * - events: array of normalized event objects
   * - loading: boolean indicating active fetch
   * - error: string error message if rejected
   * - pageInfo: pagination metadata { size, totalElements, totalPages, number }
   */
  const { events, loading, error, pageInfo } = useSelector((state) => state.events);

  // ---------------------------------------------------------------------------
  // INITIAL DATA FETCH (Mount Phase)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    dispatch(
      getEvents({
        classificationName: activeCategory,
        sort: sortOption,
        page: 0,
        size: PAGE_SIZE,
      })
    );
  }, [dispatch]); // Initial mount only

  // Helper function to smoothly scroll back up to the events feed section
  const scrollToEvents = () => {
    const section = document.getElementById('featured-events');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING & SORTING HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Handles category filter pill selection:
   * 1. Updates `activeCategory` state.
   * 2. Resets page index to 0.
   * 3. Dispatches `getEvents` with updated `classificationName`.
   */
  const handleCategoryChange = (categoryValue) => {
    if (activeCategory === categoryValue || loading) return;

    setActiveCategory(categoryValue);
    dispatch(
      getEvents({
        classificationName: categoryValue,
        sort: sortOption,
        page: 0,
        size: PAGE_SIZE,
      })
    );
  };

  /**
   * Handles sorting selection change:
   * 1. Updates `sortOption` state.
   * 2. Resets page index to 0.
   * 3. Dispatches `getEvents` with updated `sort` parameter.
   */
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOption(newSort);
    dispatch(
      getEvents({
        classificationName: activeCategory,
        sort: newSort,
        page: 0,
        size: PAGE_SIZE,
      })
    );
  };

  /**
   * Handles refreshing the current view (retry / reload).
   * Passes current UTC timestamp to guarantee the latest listings are re-evaluated
   * and provides user confirmation toast.
   */
  const handleRefreshEvents = () => {
    const currentUtc = new Date().toISOString().split('.')[0] + 'Z';
    dispatch(
      getEvents({
        classificationName: activeCategory,
        sort: sortOption,
        page: pageInfo?.number || 0,
        size: PAGE_SIZE,
        startDateTime: currentUtc,
      })
    ).then(() => {
      setRefreshNotification(true);
      setTimeout(() => setRefreshNotification(false), 2500);
    });
  };

  // ---------------------------------------------------------------------------
  // TICKETMASTER API PAGINATION COMPUTATION & HANDLERS
  // ---------------------------------------------------------------------------
  // Ticketmaster returns 0-indexed page number (0 is the first page)
  const currentPageIndex = pageInfo?.number ?? 0;
  const currentDisplayPage = currentPageIndex + 1;

  // Ticketmaster API enforces a max result constraint: page * size must be < 1,000.
  // We compute safeTotalPages to prevent requesting pages beyond Ticketmaster's ceiling.
  const apiReportedTotalPages = pageInfo?.totalPages ?? 0;
  const maxSafePages = Math.floor(1000 / PAGE_SIZE); // ~83 pages for size 12
  const totalPages = Math.min(
    Math.max(apiReportedTotalPages, apiReportedTotalPages === 0 ? 0 : 1),
    maxSafePages
  );

  const isFirstPage = currentPageIndex <= 0;
  const isLastPage =
    totalPages === 0 ||
    currentPageIndex >= totalPages - 1 ||
    currentPageIndex >= maxSafePages - 1;

  /**
   * Navigates to previous page:
   * Dispatches `getEvents` with `page: currentPageIndex - 1`.
   */
  const handlePreviousPage = () => {
    if (isFirstPage || loading) return;
    const prevPage = currentPageIndex - 1;

    dispatch(
      getEvents({
        classificationName: activeCategory,
        sort: sortOption,
        page: prevPage,
        size: PAGE_SIZE,
      })
    );
    scrollToEvents();
  };

  /**
   * Navigates to next page:
   * Dispatches `getEvents` with `page: currentPageIndex + 1`.
   */
  const handleNextPage = () => {
    if (isLastPage || loading) return;
    const nextPage = currentPageIndex + 1;

    dispatch(
      getEvents({
        classificationName: activeCategory,
        sort: sortOption,
        page: nextPage,
        size: PAGE_SIZE,
      })
    );
    scrollToEvents();
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
            Welcome to <strong>EventVerse</strong>! Easily explore exciting concerts,
            sports matches, theatrical shows, movies, and family events — or manage your
            registrations seamlessly.
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
        {/* Feed Header */}
        <div className="events-feed-header">
          <div>
            <span className="feed-badge">🎟️ Live Discovery</span>
            <h2 className="feed-title">Upcoming Live Events</h2>
            <p className="feed-subtitle">
              Browse real-time listings curated from the Ticketmaster Discovery API.
            </p>
          </div>

          <div className="feed-header-actions">
            {/* Sorting Dropdown */}
            <div className="sort-dropdown-container">
              <label htmlFor="sort-select" className="sort-label">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={handleSortChange}
                disabled={loading}
                className="sort-select"
                aria-label="Sort events"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
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
                  Updating...
                </>
              ) : (
                '🔄 Refresh'
              )}
            </button>

            {refreshNotification && (
              <span className="refresh-toast" role="status" aria-live="polite">
                ✓ Updated
              </span>
            )}
          </div>
        </div>

        {/* Category Filter Pills / Buttons */}
        <div
          className="category-filter-pills"
          role="tablist"
          aria-label="Event Categories"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`category-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.value)}
                disabled={loading}
              >
                <span className="pill-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="pill-label">{cat.label}</span>
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
                Ticketmaster Discovery API allows 5 requests/sec and 5,000 requests/day. If rate-limited, please wait a moment and click "Refresh".
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
            {Array.from({ length: 6 }).map((_, idx) => (
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
            <p>Try switching to another category or reset to view all events.</p>
            <button
              type="button"
              className="btn-cta-secondary"
              onClick={() => handleCategoryChange('')}
            >
              View All Events
            </button>
          </div>
        )}

        {/* Pagination Controls Section */}
        {!loading && events && events.length > 0 && (
          <nav
            className="pagination-controls"
            aria-label="Event listing pagination"
          >
            {/* Previous Button */}
            <button
              type="button"
              className="btn-pagination btn-prev"
              onClick={handlePreviousPage}
              disabled={isFirstPage || loading}
              aria-label="Go to previous page"
            >
              ← Previous
            </button>

            {/* Current Page and Total Pages Display */}
            <div className="pagination-info">
              <span className="page-numbers">
                Page <strong className="current-page-num">{currentDisplayPage}</strong> of{' '}
                <strong className="total-pages-num">{totalPages > 0 ? totalPages : 1}</strong>
              </span>
              {pageInfo?.totalElements > 0 && (
                <span className="total-items-badge">
                  ({pageInfo.totalElements.toLocaleString()} total events)
                </span>
              )}
            </div>

            {/* Next Button */}
            <button
              type="button"
              className="btn-pagination btn-next"
              onClick={handleNextPage}
              disabled={isLastPage || loading}
              aria-label="Go to next page"
            >
              Next →
            </button>
          </nav>
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
              Browse through a rich catalog of upcoming events filtered by category, date, and venue.
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
