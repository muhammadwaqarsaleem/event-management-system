import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEventDetails, clearSelectedEvent } from '../redux/eventsSlice';
import {
  registerEvent,
  cancelEventRegistration,
  clearRegistrationMessage,
} from '../redux/registrationsSlice';
import { extractEventImage } from '../services/ticketmasterApi';

/**
 * EventDetails Component
 * =============================================================================
 * Dedicated Event Details page for Assignment 2 (Event Management System).
 *
 * Key Concepts & Architecture:
 * -----------------------------------------------------------------------------
 * 1. React Router `useParams()`:
 *    - Extracts dynamic route parameters from the current URL path.
 *    - Defined in App.jsx as `/events/:id`.
 *    - Calling `useParams()` provides `{ id }`, matching Ticketmaster's unique event ID.
 *
 * 2. React Router `useNavigate()`:
 *    - Imperative navigation hook for programmatic redirects.
 *    - Used by the "Back to Events" button to smoothly return to the previous view
 *      via `navigate(-1)` or explicitly to `'/'`.
 *
 * 3. Redux State Selectors (`useSelector`):
 *    - Subscribes to `state.events` for event details and loading states.
 *    - Subscribes to `state.auth` for user authentication session status.
 *    - Subscribes to `state.registrations` for persisted event registrations
 *      and feedback messages.
 *
 * 4. Redux Action Dispatching (`useDispatch`):
 *    - Dispatches `getEventDetails(id)` on component mount to fetch single event details.
 *    - Dispatches `clearSelectedEvent()` and `clearRegistrationMessage()` on unmount.
 *    - Dispatches `registerEvent` and `cancelEventRegistration` based on user actions.
 *
 * 5. Dynamic Registration Controls:
 *    - If unauthenticated: redirects to `/login` with friendly prompt.
 *    - If authenticated & not registered: displays primary "Register for Event" button.
 *    - If authenticated & registered: displays green confirmation badge and
 *      "Cancel Registration" action.
 * =============================================================================
 */
function EventDetails() {
  // ---------------------------------------------------------------------------
  // 1. REACT ROUTER HOOKS
  // ---------------------------------------------------------------------------
  const { id } = useParams();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 2. REDUX DISPATCH & STATE SELECTORS
  // ---------------------------------------------------------------------------
  const dispatch = useDispatch();

  // Events slice: Selected event data and loading states
  const { selectedEvent, detailsLoading, error } = useSelector(
    (state) => state.events
  );

  // Auth slice: Current logged-in user credentials and auth status
  const { currentUser, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Registrations slice: Registered events array and feedback messages
  const { registrations, message: registrationMessage } = useSelector(
    (state) => state.registrations
  );

  // Target event ID derived safely from selectedEvent or URL param
  const currentEventId = selectedEvent?.id || id;

  /**
   * Determine whether the currently authenticated user has registered
   * for this specific event by matching both userEmail and eventId.
   */
  const isRegistered = Boolean(
    currentUser &&
    Array.isArray(registrations) &&
    registrations.some(
      (reg) => reg.userEmail === currentUser.email && reg.eventId === currentEventId
    )
  );

  // ---------------------------------------------------------------------------
  // 3. LIFECYCLE & AUTO-DISMISS FEEDBACK NOTIFICATIONS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // When the component mounts or URL `id` changes, fetch fresh details
    if (id) {
      dispatch(getEventDetails(id));
    }

    // Cleanup phase: Unmount handler
    return () => {
      dispatch(clearSelectedEvent());
      dispatch(clearRegistrationMessage());
    };
  }, [dispatch, id]);

  /**
   * Auto-dismiss the registration notification toast after 3 seconds
   */
  useEffect(() => {
    if (registrationMessage) {
      const timer = setTimeout(() => {
        dispatch(clearRegistrationMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationMessage, dispatch]);

  // ---------------------------------------------------------------------------
  // 4. ACTION HANDLERS
  // ---------------------------------------------------------------------------
  // Handler to safely navigate back
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  /**
   * Handles user click on "Register for Event":
   * 1. Checks if user is authenticated; if not, alerts and redirects to /login.
   * 2. If authenticated, dispatches `registerEvent` with userEmail and selectedEvent.
   */
  const handleRegister = () => {
    if (!isAuthenticated || !currentUser) {
      alert('Please log in to register for events.');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (selectedEvent) {
      dispatch(
        registerEvent({
          userEmail: currentUser.email,
          event: selectedEvent,
        })
      );
    }
  };

  /**
   * Handles user click on "Cancel Registration":
   * Dispatches `cancelEventRegistration` matching userEmail and eventId.
   */
  const handleCancelRegistration = () => {
    if (!currentUser || !currentEventId) return;
    dispatch(
      cancelEventRegistration({
        userEmail: currentUser.email,
        eventId: currentEventId,
      })
    );
  };


  // Safe image error fallback
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src =
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
  };

  // ---------------------------------------------------------------------------
  // 4. LOADING STATE
  // ---------------------------------------------------------------------------
  if (detailsLoading) {
    return (
      <div className="event-details-page">
        <div className="details-container">
          <div className="details-loading-state" role="status" aria-live="polite">
            <div className="loading-spinner-large" aria-hidden="true" />
            <h2 className="loading-title">Loading Event Details...</h2>
            <p className="loading-subtitle">
              Fetching real-time event, venue, and ticketing data from Ticketmaster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. ERROR STATE (Event Not Found / API Failure)
  // ---------------------------------------------------------------------------
  if (error || !selectedEvent) {
    return (
      <div className="event-details-page">
        <div className="details-container">
          <div className="details-error-card" role="alert">
            <span className="error-icon" aria-hidden="true">⚠️</span>
            <h2 className="error-title">Event Not Found</h2>
            <p className="error-message">
              {error || 'We could not locate details for this event. It may have expired or been removed.'}
            </p>
            <div className="error-actions">
              <button
                type="button"
                onClick={handleBack}
                className="btn-details-primary"
              >
                ← Back to Events
              </button>
              <button
                type="button"
                onClick={() => dispatch(getEventDetails(id))}
                className="btn-details-secondary"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 6. SAFE EXTRACTION & NORMALIZATION OF EVENT METADATA
  // ---------------------------------------------------------------------------
  const {
    name = 'Untitled Event',
    images = [],
    imageUrl,
    dateFormatted,
    timeFormatted,
    category = 'General',
    genre,
    subGenre,
    venueName,
    priceFormatted,
    status = { label: 'On Sale', type: 'onsale' },
    url: ticketmasterUrl,
    info,
    pleaseNote,
    dates = {},
  } = selectedEvent;

  // Banner Image: prefer extracted high-res image, fallback to general banner
  const bannerImage = imageUrl || extractEventImage(images);

  // Timezone information
  const timezone = dates?.timezone || 'Local Time';

  // Category and Genre badge (Segment + Genre)
  const segmentName = selectedEvent.classifications?.[0]?.segment?.name || category || 'General';
  const genreName = selectedEvent.classifications?.[0]?.genre?.name || genre || '';
  const subGenreName = selectedEvent.classifications?.[0]?.subGenre?.name || subGenre || '';

  const categoryBadgeText =
    genreName && genreName !== segmentName && genreName !== 'Undefined'
      ? `${segmentName} • ${genreName}`
      : segmentName;

  // Venue and Detailed Address Extraction
  const venue = selectedEvent._embedded?.venues?.[0] || selectedEvent.place || {};
  const displayVenueName = venueName || venue.name || 'Venue TBA';
  const streetAddress = venue.address?.line1 || selectedEvent.address || '';
  const city = venue.city?.name || '';
  const state = venue.state?.stateCode || venue.state?.name || '';
  const postalCode = venue.postalCode || '';
  const country = venue.country?.name || venue.country?.countryCode || '';

  // Formatted full address line
  const addressParts = [streetAddress, city, state, postalCode, country].filter(Boolean);
  const fullAddressString =
    addressParts.length > 0 ? addressParts.join(', ') : 'Full address details to be announced';

  // Price Display
  const displayPrice = priceFormatted || 'Check official website for pricing';

  // Status Badge Class
  const statusTypeClass = `status-${status.type || 'neutral'}`;

  // ---------------------------------------------------------------------------
  // 7. RENDER COMPLETE EVENT DETAILS VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="event-details-page">
      <div className="details-container">
        {/* Navigation Breadcrumb / Top Bar */}
        <nav className="details-nav-bar" aria-label="Breadcrumb navigation">
          <button
            type="button"
            onClick={handleBack}
            className="btn-back-link"
            aria-label="Back to events listing"
          >
            ← Back to Events
          </button>
          <span className="details-breadcrumb-sep">/</span>
          <span className="details-breadcrumb-current">{name}</span>
        </nav>

        {/* Feedback Notification / Toast Banner */}
        {registrationMessage && (
          <aside
            className={`registration-toast-banner ${
              registrationMessage.toLowerCase().includes('cancel')
                ? 'toast-cancelled'
                : registrationMessage.toLowerCase().includes('already')
                ? 'toast-warning'
                : 'toast-success'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="toast-content">
              <span className="toast-icon" aria-hidden="true">
                {registrationMessage.toLowerCase().includes('cancel')
                  ? '🗑️'
                  : registrationMessage.toLowerCase().includes('already')
                  ? '⚠️'
                  : '🎉'}
              </span>
              <span className="toast-text">{registrationMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearRegistrationMessage())}
              className="btn-toast-close"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </aside>
        )}

        {/* Main Details Article Card */}
        <article className="details-main-card">
          {/* Prominent Banner Media Section */}
          <div className="details-banner-wrapper">
            <img
              src={bannerImage}
              alt={name}
              className="details-banner-img"
              onError={handleImageError}
            />
            <div className="details-banner-overlay" />

            {/* Overlaid Badges */}
            <div className="details-banner-badges">
              {/* Category Badge (Segment + Genre) */}
              <span className="details-category-pill" title={`Category: ${categoryBadgeText}`}>
                🏷️ {categoryBadgeText}
              </span>

              {/* Ticket Status Badge */}
              <span className={`details-status-pill ${statusTypeClass}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Event Content Body */}
          <div className="details-body">
            {/* Event Header: Title & Classification */}
            <header className="details-header">
              <h1 className="details-title">{name}</h1>

              {subGenreName && subGenreName !== genreName && (
                <p className="details-subgenre-text">
                  Sub-Genre: <strong>{subGenreName}</strong>
                </p>
              )}
            </header>

            {/* Information Grid: Date/Time, Venue/Address, Pricing & Status */}
            <div className="details-info-grid">
              {/* Card 1: Date, Time & Timezone */}
              <div className="info-tile">
                <div className="info-tile-icon" aria-hidden="true">📅</div>
                <div className="info-tile-content">
                  <span className="info-tile-label">Date & Time</span>
                  <strong className="info-tile-value">
                    {dateFormatted || 'Date TBA'}
                  </strong>
                  <span className="info-tile-sub">
                    {timeFormatted || 'Time TBA'} ({timezone})
                  </span>
                </div>
              </div>

              {/* Card 2: Venue & Full Address */}
              <div className="info-tile">
                <div className="info-tile-icon" aria-hidden="true">📍</div>
                <div className="info-tile-content">
                  <span className="info-tile-label">Venue & Location</span>
                  <strong className="info-tile-value">{displayVenueName}</strong>
                  <span className="info-tile-sub" title={fullAddressString}>
                    {fullAddressString}
                  </span>
                </div>
              </div>

              {/* Card 3: Ticket Pricing */}
              <div className="info-tile">
                <div className="info-tile-icon" aria-hidden="true">💵</div>
                <div className="info-tile-content">
                  <span className="info-tile-label">Price Range</span>
                  <strong className="info-tile-value price-highlight">
                    {displayPrice}
                  </strong>
                  <span className="info-tile-sub">
                    Status: <span className="status-inline-tag">{status.label}</span>
                  </span>
                </div>
              </div>

              {/* Card 4: Event Classification */}
              <div className="info-tile">
                <div className="info-tile-icon" aria-hidden="true">🎭</div>
                <div className="info-tile-content">
                  <span className="info-tile-label">Classification</span>
                  <strong className="info-tile-value">{segmentName}</strong>
                  <span className="info-tile-sub">
                    {genreName ? `Genre: ${genreName}` : 'All Audiences'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information / Notes (if provided by Ticketmaster) */}
            {(info || pleaseNote) && (
              <section className="details-notes-section" aria-label="Event Notes">
                <h2 className="notes-heading">ℹ️ Event Information & Guidelines</h2>
                {info && <p className="notes-text">{info}</p>}
                {pleaseNote && (
                  <div className="please-note-box">
                    <strong>Please Note:</strong> {pleaseNote}
                  </div>
                )}
              </section>
            )}

            {/* Action Bar / Reservation Panel */}
            <div className="details-actions-panel">
              <div className="actions-summary">
                <span className="actions-summary-label">Admission</span>
                <span className="actions-summary-price">{displayPrice}</span>
              </div>

              <div className="actions-buttons-group">
                {/* Secondary: Back to Events Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-action-back"
                >
                  ← Back to Events
                </button>

                {/* Dynamic Event Registration Actions */}
                {isRegistered ? (
                  <div className="registration-status-group">
                    <span className="badge-registered" aria-label="Registration confirmed">
                      ✓ You are Registered
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelRegistration}
                      className="btn-action-cancel"
                      title="Cancel your registration for this event"
                    >
                      ✕ Cancel Registration
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="btn-action-register"
                    title={
                      isAuthenticated
                        ? 'Register for this event'
                        : 'Please log in to register for events'
                    }
                  >
                    🎟️ Register for Event
                  </button>
                )}

                {/* External Official Ticketmaster Link */}
                {ticketmasterUrl && (
                  <a
                    href={ticketmasterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action-external"
                    title="View official ticketing page on Ticketmaster"
                  >
                    Ticketmaster ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

export default EventDetails;
