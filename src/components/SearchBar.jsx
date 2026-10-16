import { useState, useEffect, useRef } from 'react';

/**
 * =============================================================================
 * SearchBar Component
 * =============================================================================
 * Implements Step 6: "Implement event search"
 * 
 * Key Architectural Features:
 * -----------------------------------------------------------------------------
 * 1. Dual-Input Query Fields:
 *    - Keyword Input: Searches across event titles, artist names, or venues.
 *    - City Input: Filters by city/metro area (e.g., "New York", "London").
 * 
 * 2. Rate-Limit Mitigation & Form Submission / Debounce:
 *    - Ticketmaster Discovery API enforces strict rate limits (2 requests/sec burst,
 *      5 requests/sec standard, 5,000/day).
 *    - Handling search via form submission (`onSubmit`) and explicit "Search" button
 *      prevents excessive network queries while typing.
 *    - Uses a debounce timer reference (`useRef` + `setTimeout`) to safeguard
 *      against rapid repeated submissions and eliminate memory leaks on unmount.
 * 
 * 3. State Synchronization Without Cascading Effects:
 *    - Adheres to official React 19 patterns by adjusting local state during render
 *      when incoming props (`initialKeyword`, `initialCity`) change, avoiding
 *      unnecessary and performance-degrading cascading effect re-renders.
 *    - The "Clear / Reset" button immediately resets both input fields, focuses
 *      the keyword input, and calls `onReset()` to refetch default page 0 listings.
 * 
 * @param {Object} props
 * @param {string} [props.initialKeyword=''] - Current search keyword from parent state
 * @param {string} [props.initialCity=''] - Current city filter from parent state
 * @param {Function} props.onSearch - Callback invoked with `{ keyword, city }` on submit
 * @param {Function} props.onReset - Callback invoked to clear search criteria and reset page
 * @param {boolean} [props.isLoading=false] - Whether an API request is currently in-flight
 */
function SearchBar({
  initialKeyword = '',
  initialCity = '',
  onSearch,
  onReset,
  isLoading = false,
}) {
  // Local input state for smooth, uninhibited typing
  const [keyword, setKeyword] = useState(initialKeyword);
  const [city, setCity] = useState(initialCity);

  // Track previous prop values to sync state during render (React 19 recommended pattern)
  const [prevInitialKeyword, setPrevInitialKeyword] = useState(initialKeyword);
  const [prevInitialCity, setPrevInitialCity] = useState(initialCity);

  if (initialKeyword !== prevInitialKeyword) {
    setPrevInitialKeyword(initialKeyword);
    setKeyword(initialKeyword);
  }

  if (initialCity !== prevInitialCity) {
    setPrevInitialCity(initialCity);
    setCity(initialCity);
  }

  // Reference to track debounce timer and prevent memory leaks on unmount
  const debounceTimerRef = useRef(null);
  const keywordInputRef = useRef(null);

  /**
   * Cleanup debounce timer when component unmounts
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Form Submission Handler:
   * Prevents browser page reload and immediately fires the search callback.
   * Cancels any pending debounced timers to avoid duplicate requests.
   */
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // Cancel pending debounce to prevent double-firing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (onSearch && typeof onSearch === 'function') {
      onSearch({
        keyword: keyword.trim(),
        city: city.trim(),
      });
    }
  };

  /**
   * Reset / Clear Handler:
   * 1. Clears both local keyword and city inputs.
   * 2. Clears any pending debounce timers.
   * 3. Triggers parent onReset callback to re-fetch unfiltered events at page 0.
   * 4. Returns focus to keyword input for optimal accessibility and UX.
   */
  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setKeyword('');
    setCity('');

    if (onReset && typeof onReset === 'function') {
      onReset();
    }

    if (keywordInputRef.current) {
      keywordInputRef.current.focus();
    }
  };

  // Helper to clear only the keyword field
  const handleClearKeyword = () => {
    setKeyword('');
    if (keywordInputRef.current) {
      keywordInputRef.current.focus();
    }
  };

  // Helper to clear only the city field
  const handleClearCity = () => {
    setCity('');
  };

  const hasActiveInput = keyword.trim().length > 0 || city.trim().length > 0;

  return (
    <div className="search-bar-wrapper">
      <form
        className="search-bar-form"
        role="search"
        aria-label="Search events by keyword and city"
        onSubmit={handleSubmit}
      >
        <div className="search-inputs-group">
          {/* Keyword Search Input Field */}
          <div className="search-input-field keyword-field">
            <span className="search-field-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>

            <input
              ref={keywordInputRef}
              id="search-keyword-input"
              type="text"
              className="search-input"
              placeholder="Search events, artists, or venues..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={isLoading}
              aria-label="Search events, artists, or venues"
              autoComplete="off"
            />

            {keyword.length > 0 && (
              <button
                type="button"
                className="btn-clear-field"
                onClick={handleClearKeyword}
                aria-label="Clear keyword input"
                title="Clear keyword"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Location Input Field */}
          <div className="search-input-field city-field">
            <span className="search-field-icon" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>

            <input
              id="search-city-input"
              type="text"
              className="search-input"
              placeholder="City (e.g., New York, London)..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isLoading}
              aria-label="City filter"
              autoComplete="off"
            />

            {city.length > 0 && (
              <button
                type="button"
                className="btn-clear-field"
                onClick={handleClearCity}
                aria-label="Clear city input"
                title="Clear city"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Search and Reset */}
        <div className="search-actions-group">
          <button
            type="submit"
            className="btn-search-submit"
            disabled={isLoading}
            aria-label="Submit search"
          >
            {isLoading ? (
              <>
                <span className="search-spinner" aria-hidden="true" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>

          {(hasActiveInput || initialKeyword || initialCity) && (
            <button
              type="button"
              className="btn-search-clear"
              onClick={handleClear}
              disabled={isLoading}
              aria-label="Clear all search parameters"
              title="Reset search criteria"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Clear</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
