import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents } from '../redux/eventsSlice';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';

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
 * Implements Step 5: "Add event listing" & Step 6: "Implement event search"
 *
 * Architectural & Multi-Filter Coordination Highlights:
 * -----------------------------------------------------------------------------
 * 1. Multi-Parameter Combination:
 *    - Simultaneously combines search `keyword`, `city`, `classificationName` (category),
 *      and `sort` option into a single unified query sent to Ticketmaster Discovery API.
 *    - For instance, searching for "Rock" in "New York" under "Music" category properly
 *      sends: `keyword=Rock&city=New+York&classificationName=Music&sort=date,asc`.
 *
 * 2. URL State Synchronization (`useSearchParams`):
 *    - Synchronizes active search criteria (`keyword`, `city`, `category`) with URL
 *      query parameters (e.g. `/?keyword=Coldplay&city=London&category=Music`).
 *    - Enables shareable links, browser back/forward navigation, and seamless state
 *      preservation across page reloads.
 *
 * 3. Pagination Reset Policy:
 *    - Ticketmaster Discovery API pagination is 0-indexed.
 *    - Whenever any search criterion changes (new keyword, city, or category),
 *      pagination is explicitly reset to page 0 to avoid displaying empty pages
 *      beyond the new query's result set.
 *
 * 4. Active Search Indicators & Chips:
 *    - Renders dynamic filter chips displaying active keywords, cities, and categories.
 *    - Allows attendees to dismiss individual filters with a single click or clear
 *      all filters simultaneously.
 *
 * 5. Robust Empty State Handling:
 *    - If no events are returned for the given filter combination, displays an
 *      encouraging empty state with an actionable "Clear Filters" button that
 *      resets keyword, city, and category back to defaults.
 * -----------------------------------------------------------------------------
 */
function Home() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---------------------------------------------------------------------------
  // URL QUERY PARAMETER INITIALIZATION
  // ---------------------------------------------------------------------------
  const urlKeyword = searchParams.get('keyword') || '';
  const urlCity = searchParams.get('city') || '';
  const urlCategory = searchParams.get('category') || '';

  // ---------------------------------------------------------------------------
  // LOCAL COMPONENT STATE (Filters, Search, Sorting & Notifications)
  // ---------------------------------------------------------------------------
  const [searchKeyword, setSearchKeyword] = useState(urlKeyword);
  const [searchCity, setSearchCity] = useState(urlCity);
  const [activeCategory, setActiveCategory] = useState(urlCategory);
  const [sortOption, setSortOption] = useState('date,asc');
  const [refreshNotification, setRefreshNotification] = useState(false);

  // ---------------------------------------------------------------------------
  // REDUX STORE SELECTORS
  // ---------------------------------------------------------------------------
  /**
   * Access centralized events slice state:
   * - events: array of normalized event objects
   * - loading: boolean tracking in-flight API calls
   * - error: error message string if rejected
   * - pageInfo: pagination metadata { size, totalElements, totalPages, number }
   */
  const { events, loading, error, pageInfo } = useSelector((state) => state.events);

  // Helper function to smoothly scroll back up to the events feed section
  const scrollToEvents = () => {
    const section = document.getElementById('featured-events');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Helper to sync active search and category state with browser URL search params.
   * Keeps URLs clean by omitting empty string parameters.
   */
  const updateUrlParams = useCallback(
    (keyword, city, category) => {
      const nextParams = {};
      if (keyword && keyword.trim()) nextParams.keyword = keyword.trim();
      if (city && city.trim()) nextParams.city = city.trim();
      if (category && category.trim()) nextParams.category = category.trim();

      setSearchParams(nextParams, { replace: true });
    },
    [setSearchParams]
  );

  /**
   * Centralized event fetch dispatcher:
   * Combines keyword, city, category, sort, and page into a single Redux thunk call.
   */
  const executeEventFetch = useCallback(
    ({
      keyword = searchKeyword,
      city = searchCity,
      category = activeCategory,
      sort = sortOption,
      page = 0,
      startDateTime = '',
    } = {}) => {
      dispatch(
        getEvents({
          keyword: keyword.trim(),
          city: city.trim(),
          classificationName: category.trim(),
          sort,
          page,
          size: PAGE_SIZE,
          ...(startDateTime ? { startDateTime } : {}),
        })
      );
    },
    [dispatch, searchKeyword, searchCity, activeCategory, sortOption]
  );

  // ---------------------------------------------------------------------------
  // INITIAL DATA FETCH (Mount Phase)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    executeEventFetch({
      keyword: urlKeyword,
      city: urlCity,
      category: urlCategory,
      sort: sortOption,
      page: 0,
    });
    // Run on initial mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // SEARCH HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Handles search execution from SearchBar component:
   * 1. Updates keyword and city states.
   * 2. Synchronizes URL parameters.
   * 3. Resets pagination to page 0.
   * 4. Dispatches getEvents combining search inputs with current category & sort.
   */
  const handleSearch = ({ keyword, city }) => {
    setSearchKeyword(keyword);
    setSearchCity(city);
    updateUrlParams(keyword, city, activeCategory);

    executeEventFetch({
      keyword,
      city,
      category: activeCategory,
      sort: sortOption,
      page: 0,
    });

    scrollToEvents();
  };

  /**
   * Handles resetting search bar inputs while preserving active category filter.
   */
  const handleResetSearch = () => {
    setSearchKeyword('');
    setSearchCity('');
    updateUrlParams('', '', activeCategory);

    executeEventFetch({
      keyword: '',
      city: '',
      category: activeCategory,
      sort: sortOption,
      page: 0,
    });
  };

  // ---------------------------------------------------------------------------
  // FILTERING & SORTING HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Handles category filter pill selection:
   * 1. Updates activeCategory state.
   * 2. Synchronizes URL parameters.
   * 3. Resets page index to 0.
   * 4. Dispatches getEvents combining current search queries with the new category.
   */
  const handleCategoryChange = (categoryValue) => {
    if (activeCategory === categoryValue || loading) return;

    setActiveCategory(categoryValue);
    updateUrlParams(searchKeyword, searchCity, categoryValue);

    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: categoryValue,
      sort: sortOption,
      page: 0,
    });
  };

  /**
   * Handles clearing all filters (keyword, city, category) at once.
   * Used by Empty State "Clear Filters" button and Active Chips "Clear all" button.
   */
  const handleClearAllFilters = () => {
    setSearchKeyword('');
    setSearchCity('');
    setActiveCategory('');
    updateUrlParams('', '', '');

    executeEventFetch({
      keyword: '',
      city: '',
      category: '',
      sort: sortOption,
      page: 0,
    });
  };

  /**
   * Handles individual filter removals from active chips
   */
  const handleRemoveKeywordFilter = () => {
    setSearchKeyword('');
    updateUrlParams('', searchCity, activeCategory);
    executeEventFetch({
      keyword: '',
      city: searchCity,
      category: activeCategory,
      sort: sortOption,
      page: 0,
    });
  };

  const handleRemoveCityFilter = () => {
    setSearchCity('');
    updateUrlParams(searchKeyword, '', activeCategory);
    executeEventFetch({
      keyword: searchKeyword,
      city: '',
      category: activeCategory,
      sort: sortOption,
      page: 0,
    });
  };

  const handleRemoveCategoryFilter = () => {
    setActiveCategory('');
    updateUrlParams(searchKeyword, searchCity, '');
    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: '',
      sort: sortOption,
      page: 0,
    });
  };

  /**
   * Handles sorting selection change:
   * 1. Updates sortOption state.
   * 2. Resets page index to 0.
   * 3. Dispatches getEvents with updated sort parameter and existing filters.
   */
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOption(newSort);

    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: activeCategory,
      sort: newSort,
      page: 0,
    });
  };

  /**
   * Handles refreshing the current view (retry / reload).
   */
  const handleRefreshEvents = () => {
    const currentUtc = new Date().toISOString().split('.')[0] + 'Z';

    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: activeCategory,
      sort: sortOption,
      page: pageInfo?.number || 0,
      startDateTime: currentUtc,
    });

    setRefreshNotification(true);
    setTimeout(() => setRefreshNotification(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // TICKETMASTER API PAGINATION COMPUTATION & HANDLERS
  // ---------------------------------------------------------------------------
  const currentPageIndex = pageInfo?.number ?? 0;
  const currentDisplayPage = currentPageIndex + 1;

  // Ticketmaster API enforces a max result constraint: page * size must be < 1,000.
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

  const handlePreviousPage = () => {
    if (isFirstPage || loading) return;
    const prevPage = currentPageIndex - 1;

    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: activeCategory,
      sort: sortOption,
      page: prevPage,
    });
    scrollToEvents();
  };

  const handleNextPage = () => {
    if (isLastPage || loading) return;
    const nextPage = currentPageIndex + 1;

    executeEventFetch({
      keyword: searchKeyword,
      city: searchCity,
      category: activeCategory,
      sort: sortOption,
      page: nextPage,
    });
    scrollToEvents();
  };

  // Check if any filters are actively applied
  const hasActiveFilters = Boolean(
    searchKeyword.trim() || searchCity.trim() || activeCategory.trim()
  );

  // Active category display label helper
  const activeCategoryObj = CATEGORIES.find((cat) => cat.value === activeCategory);
  const activeCategoryLabel = activeCategoryObj?.label || activeCategory;

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

        {/* ================================================================= */}
        {/* SEARCH BAR (Prominently Placed Above Categories & Event Grid)     */}
        {/* ================================================================= */}
        <SearchBar
          initialKeyword={searchKeyword}
          initialCity={searchCity}
          onSearch={handleSearch}
          onReset={handleResetSearch}
          isLoading={loading}
        />

        {/* ================================================================= */}
        {/* ACTIVE SEARCH INDICATORS & FILTER CHIPS                           */}
        {/* ================================================================= */}
        {hasActiveFilters && (
          <div className="active-filters-container" aria-label="Active filters">
            <span className="active-filters-title">
              Active Filters:
            </span>

            <div className="active-filter-chips">
              {/* Keyword Filter Chip */}
              {searchKeyword.trim() && (
                <span className="filter-chip">
                  <span className="chip-icon" aria-hidden="true">🔍</span>
                  <span className="chip-text">
                    Keyword: <strong>"{searchKeyword}"</strong>
                  </span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={handleRemoveKeywordFilter}
                    aria-label={`Remove keyword filter: ${searchKeyword}`}
                    title="Remove keyword filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* City Filter Chip */}
              {searchCity.trim() && (
                <span className="filter-chip">
                  <span className="chip-icon" aria-hidden="true">📍</span>
                  <span className="chip-text">
                    City: <strong>"{searchCity}"</strong>
                  </span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={handleRemoveCityFilter}
                    aria-label={`Remove city filter: ${searchCity}`}
                    title="Remove city filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Category Filter Chip */}
              {activeCategory.trim() && (
                <span className="filter-chip">
                  <span className="chip-icon" aria-hidden="true">🏷️</span>
                  <span className="chip-text">
                    Category: <strong>{activeCategoryLabel}</strong>
                  </span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={handleRemoveCategoryFilter}
                    aria-label={`Remove category filter: ${activeCategoryLabel}`}
                    title="Remove category filter"
                  >
                    ✕
                  </button>
                </span>
              )}

              {/* Clear All Filters Button */}
              <button
                type="button"
                className="btn-clear-all-filters"
                onClick={handleClearAllFilters}
                aria-label="Clear all applied filters"
              >
                Clear all filters
              </button>
            </div>

            {/* Contextual search result feedback */}
            {!loading && events && (
              <span className="active-filter-count">
                {pageInfo?.totalElements > 0
                  ? `${pageInfo.totalElements.toLocaleString()} results found`
                  : 'Searching...'}
              </span>
            )}
          </div>
        )}

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

        {/* ================================================================= */}
        {/* EMPTY STATE CONTAINER (Handled when events array is empty)        */}
        {/* ================================================================= */}
        {!loading && !error && (!events || events.length === 0) && (
          <div className="feed-empty-state" role="status">
            <div className="empty-icon-bubble">
              <span className="empty-icon" aria-hidden="true">🔍</span>
            </div>
            <h3 className="empty-state-title">No events found matching your criteria</h3>
            <p className="empty-state-desc">
              {hasActiveFilters
                ? "We couldn't find any events matching your active keyword, city, or category filters. Try refining your terms or resetting filters to see all available events."
                : "There are currently no events scheduled under this selection. Please check back later or explore other categories."}
            </p>
            <div className="empty-state-actions">
              <button
                type="button"
                className="btn-clear-filters-primary"
                onClick={handleClearAllFilters}
              >
                Clear Filters
              </button>
            </div>
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
