import { Link } from 'react-router-dom';
import { formatEventData } from '../services/ticketmasterApi';

/**
 * EventCard Component
 * =============================================================================
 * Renders an accessible, responsive event card for Ticketmaster events.
 * 
 * Features & Display Architecture:
 * 1. Image Media Section with aspect ratio 16:9, lazy loading, and error fallback.
 * 2. Overlaid Badges:
 *    - Category Badge (e.g., "Music", "Sports", "Arts & Theatre")
 *    - Status Badge (e.g., "On Sale", "Rescheduled", "Cancelled")
 * 3. Title with legible hierarchy and hover effects.
 * 4. Explicit Metadata Rows:
 *    - 🏷️ Category & Genre (e.g., "Arts & Theatre • Musical", "Music • Rock")
 *    - 📅 Date & Time (e.g., "Oct 24, 2026 • 7:30 PM" or "Time TBA")
 *    - 📍 Venue & City (e.g., "Lyceum Theatre, London, Great Britain")
 * 5. Price Tag (e.g., "$45 - $120" or "See Details")
 * 6. Internal Route Link to `/events/:id`
 * -----------------------------------------------------------------------------
 * 
 * @param {Object} props
 * @param {Object} props.event - Event object (normalized or raw Ticketmaster HAL JSON)
 */
function EventCard({ event }) {
  if (!event) return null;

  // Use pre-normalized fields if available, otherwise run formatEventData fallback
  const item = event.dateFormatted ? event : formatEventData(event);

  if (!item) return null;

  const {
    id,
    name,
    imageUrl,
    dateFormatted,
    timeFormatted,
    venueName,
    locationFormatted,
    category,
    genre,
    subGenre,
    priceFormatted,
    status,
  } = item;

  // Safe fallback if the Ticketmaster image URL errors out
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src =
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';
  };

  // Build clean category/genre display string
  const categoryLabel = category || 'General';
  const genreDetail = genre && genre !== categoryLabel ? genre : subGenre;
  const fullCategoryString = genreDetail
    ? `${categoryLabel} • ${genreDetail}`
    : categoryLabel;

  return (
    <article className="event-card">
      {/* Top Media Section */}
      <div className="event-card-media">
        <Link to={`/events/${id}`} className="event-card-media-link" tabIndex={-1} aria-hidden="true">
          <img
            src={imageUrl}
            alt={name}
            className="event-card-img"
            loading="lazy"
            onError={handleImageError}
          />
        </Link>

        {/* Top-Left: Category Badge */}
        <span className="event-category-badge" title={fullCategoryString}>
          {categoryLabel}
        </span>

        {/* Top-Right: Ticket Status Badge */}
        {status && status.label && (
          <span className={`event-status-badge status-${status.type || 'neutral'}`}>
            {status.label}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div className="event-card-body">
        {/* Event Title */}
        <h3 className="event-card-title" title={name}>
          <Link to={`/events/${id}`} className="event-title-link">
            {name}
          </Link>
        </h3>

        {/* Structured Metadata Rows */}
        <div className="event-card-meta">
          {/* Row 1: Explicit Category & Genre Display */}
          <div className="event-meta-row" title={`Category: ${fullCategoryString}`}>
            <span className="event-meta-icon" aria-hidden="true">🏷️</span>
            <span className="event-meta-text">
              <strong className="event-meta-label">Category:</strong>{' '}
              <span className="event-category-text">{fullCategoryString}</span>
            </span>
          </div>

          {/* Row 2: Formatted Date & Time */}
          <div className="event-meta-row" title={`Date: ${dateFormatted} at ${timeFormatted}`}>
            <span className="event-meta-icon" aria-hidden="true">📅</span>
            <span className="event-meta-text">
              <strong className="event-meta-label">Date:</strong> {dateFormatted}
              {timeFormatted ? ` • ${timeFormatted}` : ''}
            </span>
          </div>

          {/* Row 3: Venue & City / Region */}
          <div className="event-meta-row" title={`Venue: ${venueName}, ${locationFormatted}`}>
            <span className="event-meta-icon" aria-hidden="true">📍</span>
            <span className="event-meta-text">
              <strong className="event-venue-name">{venueName}</strong>
              {locationFormatted && locationFormatted !== venueName && (
                <span className="event-location-text">, {locationFormatted}</span>
              )}
            </span>
          </div>
        </div>

        {/* Card Footer: Price Range and Internal Route Button */}
        <div className="event-card-footer">
          {priceFormatted ? (
            <div className="event-price-tag">
              <span className="price-label">Tickets</span>
              <span className="price-value">{priceFormatted}</span>
            </div>
          ) : (
            <div className="event-price-tag muted">
              <span className="price-label">Tickets</span>
              <span className="price-value">See Details</span>
            </div>
          )}

          {/* Internal Link to Event Details route */}
          <Link
            to={`/events/${id}`}
            className="btn-event-details"
            aria-label={`View details for ${name}`}
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
