import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  cancelEventRegistration,
  clearRegistrationMessage,
} from '../redux/registrationsSlice';
import { DEFAULT_EVENT_PLACEHOLDER } from '../utils/imageHelper';

/**
 * Parses an event's date string into a local Date timestamp at midnight (00:00:00).
 *
 * Why this is necessary:
 * -----------------------------------------------------------------------------
 * 1. Ticketmaster date strings typically come in "YYYY-MM-DD" format.
 * 2. Directly invoking `new Date("YYYY-MM-DD")` interprets the input as UTC midnight.
 *    In time zones west of UTC (e.g., UTC-5), this shifts the date to the preceding day!
 * 3. Constructing with `new Date(year, month - 1, day)` forces local browser time,
 *    guaranteeing an accurate comparison against today's local date (`setHours(0,0,0,0)`).
 * 4. Events with "TBA" or invalid dates are treated as future/upcoming events by default.
 *
 * @param {string} dateStr - Raw date string (e.g., "2026-10-25" or "TBA").
 * @returns {number} Millisecond timestamp at local midnight, or Infinity for TBA.
 */
const parseEventDateTimestamp = (dateStr) => {
  if (!dateStr || dateStr === 'TBA') {
    return Infinity; // Treat TBA events as upcoming
  }

  // Handle standard YYYY-MM-DD format without UTC skew
  const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (ymdMatch) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).setHours(0, 0, 0, 0);
  }

  // Fallback for full ISO timestamps or alternative formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate()
    ).setHours(0, 0, 0, 0);
  }

  return Infinity;
};

/**
 * Formats a raw date string into a human-readable localized presentation.
 * E.g., "2026-10-25" -> "Sun, Oct 25, 2026"
 *
 * @param {string} dateStr - Stored date string
 * @returns {string} Formatted human-friendly date string
 */
const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === 'TBA') return 'Date TBA';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch (err) {
    console.warn('Failed to format display date:', err);
  }

  return dateStr;
};

/**
 * Formats 24-hour time "HH:mm:ss" into 12-hour AM/PM format "h:mm A".
 *
 * @param {string} timeStr - Stored time string (e.g., "19:30:00" or "TBA")
 * @returns {string} Formatted time string
 */
const formatDisplayTime = (timeStr) => {
  if (!timeStr || timeStr === 'TBA') return '';

  const timeParts = timeStr.split(':');
  if (timeParts.length >= 2) {
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
  }
  return timeStr;
};

/**
 * MyEvents Page Component
 * =============================================================================
 * Step 8: Add My Events Implementation (Protected by Step 9 Route Guards)
 *
 * Core Features:
 * -----------------------------------------------------------------------------
 * 1. User-Filtered Redux Selector:
 *    - Accesses `currentUser` from Redux `auth` slice and `registrations` from
 *      Redux `registrations` slice.
 *    - Strictly filters registrations by matching `reg.userEmail` to `currentUser.email`.
 *
 * 2. Deterministic Image Rendering:
 *    - Directly renders `registration.eventImage` (persisted by `registrationsSlice`
 *      via `getEventImage(event)`).
 *    - Falls back to `DEFAULT_EVENT_PLACEHOLDER` on load error or if empty.
 *
 * 3. Dynamic Date Parsing & Categorization:
 *    - Parses `eventDate` against today's local date (`new Date().setHours(0,0,0,0)`).
 *    - Divides registrations into:
 *        * `upcomingEvents`: eventDate >= today
 *        * `pastEvents`: eventDate < today
 *
 * 4. Tabbed Navigation Layout:
 *    - Interactive tabs for "Upcoming Events (count)" and "Past Events (count)".
 *
 * 5. Interactive Event Cards:
 *    - Banner thumbnail with fallback image handling.
 *    - Event title, venue, city, and localized date & time.
 *    - Upcoming Events: "View Details" link and "Cancel Registration" button
 *      dispatching `cancelEventRegistration`.
 *    - Past Events: Grayed-out "Completed" badge with disabled cancellation.
 * =============================================================================
 */
function MyEvents() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Active tab state: 'upcoming' | 'past'
  const [activeTab, setActiveTab] = useState('upcoming');

  // Confirmation modal / inline prompt state for cancellation
  const [cancellingEventId, setCancellingEventId] = useState(null);

  // ---------------------------------------------------------------------------
  // 1. REDUX STATE SELECTORS
  // ---------------------------------------------------------------------------
  // Access authentication state to obtain active user credentials
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  // Access registration state containing persisted registrations and status feedback
  const { registrations, message: registrationMessage } = useSelector(
    (state) => state.registrations
  );

  // ---------------------------------------------------------------------------
  // 2. USER-FILTERED SELECTORS & DATE CATEGORIZATION
  // ---------------------------------------------------------------------------
  /**
   * Filter and categorize registered events with `useMemo`:
   * - Avoids redundant array filtering and sorting on unrelated re-renders.
   * - Dynamically categorizes into `upcomingEvents` and `pastEvents`.
   */
  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!currentUser || !currentUser.email) {
      return { upcomingEvents: [], pastEvents: [] };
    }

    const normalizedUserEmail = currentUser.email.trim().toLowerCase();

    // 1. Strictly filter registrations belonging to current logged-in user
    const userRegistrations = registrations.filter(
      (reg) =>
        reg.userEmail &&
        reg.userEmail.trim().toLowerCase() === normalizedUserEmail
    );

    // 2. Determine local midnight benchmark for today
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];

    // 3. Categorize each registration against today's local date
    userRegistrations.forEach((event) => {
      const eventTimestamp = parseEventDateTimestamp(event.eventDate);

      if (eventTimestamp >= todayTimestamp) {
        // Event date is today or in the future
        upcoming.push(event);
      } else {
        // Event date has already passed
        past.push(event);
      }
    });

    // 4. Sort upcoming events chronologically (soonest first)
    upcoming.sort((a, b) => {
      const timeA = parseEventDateTimestamp(a.eventDate);
      const timeB = parseEventDateTimestamp(b.eventDate);
      return timeA - timeB;
    });

    // 5. Sort past events chronologically descending (most recently completed first)
    past.sort((a, b) => {
      const timeA = parseEventDateTimestamp(a.eventDate);
      const timeB = parseEventDateTimestamp(b.eventDate);
      return timeB - timeA;
    });

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [registrations, currentUser]);

  // ---------------------------------------------------------------------------
  // 3. CANCELLATION HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Dispatches the cancellation action to Redux store.
   * Updates state and synchronizes with localStorage via `registrationsSlice`.
   *
   * @param {Object} event - The registration record to cancel.
   */
  const handleConfirmCancel = (event) => {
    if (!currentUser?.email || !event?.eventId) return;

    dispatch(
      cancelEventRegistration({
        userEmail: currentUser.email,
        eventId: event.eventId,
      })
    );

    // Reset cancelling modal/state
    setCancellingEventId(null);
  };

  /**
   * Safe image fallback handler to prevent broken image icons.
   */
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_EVENT_PLACEHOLDER;
  };

  // ---------------------------------------------------------------------------
  // 4. UNAUTHENTICATED STATE FALLBACK (Safety Guard)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="my-events-page">
        <div className="my-events-container">
          <div className="my-events-empty-card auth-required-card">
            <div className="empty-icon-bubble" aria-hidden="true">
              🔒
            </div>
            <h2 className="empty-card-title">Authentication Required</h2>
            <p className="empty-card-desc">
              Please sign in to your EventVerse account to view your event
              registrations and tickets.
            </p>
            <div className="empty-card-actions">
              <Link to="/login" className="btn-explore-events">
                Sign In to View Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine current active list based on selected tab
  const activeEventsList = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="my-events-page">
      <div className="my-events-container">
        {/* Page Header */}
        <header className="my-events-header">
          <div className="my-events-header-text">
            <span className="my-events-badge-pill">Dashboard</span>
            <h1 className="my-events-title">My Registered Events</h1>
            <p className="my-events-subtitle">
              Manage your upcoming reservations and review past event attendances
              for <strong className="user-highlight">{currentUser.name || currentUser.email}</strong>.
            </p>
          </div>

          {/* Quick Action to Explore More */}
          <Link to="/" className="btn-browse-more">
            <span aria-hidden="true">➕</span> Discover More Events
          </Link>
        </header>

        {/* Action / Notification Banner from Redux Feedback */}
        {registrationMessage && (
          <div
            className="registration-feedback-banner"
            role="status"
            aria-live="polite"
          >
            <span className="feedback-banner-icon" aria-hidden="true">
              ℹ️
            </span>
            <span className="feedback-banner-text">{registrationMessage}</span>
            <button
              type="button"
              className="feedback-banner-dismiss"
              onClick={() => dispatch(clearRegistrationMessage())}
              aria-label="Dismiss feedback message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div className="my-events-tabs-wrapper" role="tablist" aria-label="Event Status Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`my-events-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <span className="tab-icon" aria-hidden="true">
              🚀
            </span>
            <span className="tab-label">Upcoming Events</span>
            <span className="tab-count-badge">{upcomingEvents.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            className={`my-events-tab ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <span className="tab-icon" aria-hidden="true">
              📜
            </span>
            <span className="tab-label">Past Events</span>
            <span className="tab-count-badge tab-count-muted">
              {pastEvents.length}
            </span>
          </button>
        </div>

        {/* Tab Content Section */}
        <section
          className="my-events-content"
          aria-live="polite"
          aria-label={`${activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Events List`}
        >
          {activeEventsList.length === 0 ? (
            /* Empty State Handling */
            <div className="my-events-empty-card">
              <div className="empty-icon-bubble" aria-hidden="true">
                {activeTab === 'upcoming' ? '🎟️' : '🕰️'}
              </div>
              <h2 className="empty-card-title">
                {activeTab === 'upcoming'
                  ? 'You have not registered for any upcoming events yet'
                  : 'No past event history found'}
              </h2>
              <p className="empty-card-desc">
                {activeTab === 'upcoming'
                  ? 'Find concerts, sports, theater, and arts events happening near you and register with one click.'
                  : 'Events you attended in the past will appear here once their scheduled dates have concluded.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-explore-events"
              >
                <span>🔍 Explore Events</span>
              </button>
            </div>
          ) : (
            /* Events Grid */
            <div className="my-events-grid">
              {activeEventsList.map((event) => {
                const isUpcoming = activeTab === 'upcoming';
                const displayDate = formatDisplayDate(event.eventDate);
                const displayTime = formatDisplayTime(event.eventTime);
                const locationLabel = [event.venueName, event.venueCity]
                  .filter(Boolean)
                  .join(', ');

                const isConfirmingCancel = cancellingEventId === event.eventId;

                // Directly render stored eventImage with reliable fallback
                const cardImage = event.eventImage || DEFAULT_EVENT_PLACEHOLDER;

                return (
                  <article
                    key={event.registrationId || `${event.eventId}-${event.userEmail}`}
                    className={`my-event-card ${!isUpcoming ? 'my-event-card-past' : ''}`}
                  >
                    {/* Event Banner Media */}
                    <div className="my-event-media">
                      <Link
                        to={`/events/${event.eventId}`}
                        className="my-event-media-link"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <img
                          src={cardImage}
                          alt={event.eventTitle}
                          className="my-event-img"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      </Link>

                      {/* Status Badges */}
                      {isUpcoming ? (
                        <span className="my-event-badge badge-upcoming">
                          <span className="status-dot-pulse" aria-hidden="true" />
                          Upcoming
                        </span>
                      ) : (
                        <span className="my-event-badge badge-completed">
                          <span className="status-dot-gray" aria-hidden="true" />
                          Completed
                        </span>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="my-event-body">
                      {/* Event Title */}
                      <h3 className="my-event-title" title={event.eventTitle}>
                        <Link
                          to={`/events/${event.eventId}`}
                          className="my-event-title-link"
                        >
                          {event.eventTitle}
                        </Link>
                      </h3>

                      {/* Metadata Details */}
                      <div className="my-event-meta-list">
                        {/* Date & Time */}
                        <div className="my-event-meta-item">
                          <span className="meta-icon" aria-hidden="true">
                            📅
                          </span>
                          <span className="meta-text">
                            <strong>Date:</strong> {displayDate}
                            {displayTime ? ` • ${displayTime}` : ''}
                          </span>
                        </div>

                        {/* Venue & City */}
                        <div className="my-event-meta-item">
                          <span className="meta-icon" aria-hidden="true">
                            📍
                          </span>
                          <span className="meta-text" title={locationLabel}>
                            <strong>Venue:</strong>{' '}
                            {event.venueName || 'Venue TBA'}
                            {event.venueCity ? `, ${event.venueCity}` : ''}
                          </span>
                        </div>

                        {/* Registration Date Timestamp */}
                        {event.registeredAt && (
                          <div className="my-event-meta-item registration-date-meta">
                            <span className="meta-icon" aria-hidden="true">
                              ✍️
                            </span>
                            <span className="meta-text">
                              <strong>Registered:</strong>{' '}
                              {new Date(event.registeredAt).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Controls */}
                      <div className="my-event-actions">
                        {/* View Details Primary Action */}
                        <Link
                          to={`/events/${event.eventId}`}
                          className="btn-card-details"
                        >
                          View Details
                        </Link>

                        {/* Conditional Cancellation or Completed Badge */}
                        {isUpcoming ? (
                          isConfirmingCancel ? (
                            /* Inline Confirmation State */
                            <div className="cancel-confirm-box">
                              <span className="cancel-confirm-text">Cancel?</span>
                              <button
                                type="button"
                                className="btn-confirm-yes"
                                onClick={() => handleConfirmCancel(event)}
                                title="Confirm cancellation"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="btn-confirm-no"
                                onClick={() => setCancellingEventId(null)}
                                title="Keep registration"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            /* Standard Cancel Registration Button */
                            <button
                              type="button"
                              className="btn-card-cancel"
                              onClick={() => setCancellingEventId(event.eventId)}
                              aria-label={`Cancel registration for ${event.eventTitle}`}
                            >
                              <span aria-hidden="true">✕</span> Cancel Registration
                            </button>
                          )
                        ) : (
                          /* Disabled Cancellation for Past Events */
                          <button
                            type="button"
                            className="btn-card-cancel-disabled"
                            disabled
                            title="Past events cannot be cancelled"
                            aria-label="Past event cannot be cancelled"
                          >
                            <span>✓ Completed</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default MyEvents;
