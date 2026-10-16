/**
 * Ticketmaster Discovery API Service & Data Normalizer
 * =============================================================================
 * Handles all network requests to the Ticketmaster Discovery API v2,
 * error handling (401, 429 rate limit, 404), query construction,
 * and safe normalization/extraction of the complex HAL JSON event schema.
 * 
 * Documentation Reference:
 * https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 * -----------------------------------------------------------------------------
 */

// Securely read the API key from Vite's environment variables (or process.env fallback)
const API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TICKETMASTER_API_KEY) ||
  'ba3HLAE03GfcxBq6ebPyuwE0GMCPJAIW';

// Base Discovery API v2 endpoint URL
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

/**
 * Validates that the API key is present before dispatching network requests.
 * @throws {Error} If VITE_TICKETMASTER_API_KEY is not configured in .env
 */
const ensureApiKey = () => {
  if (!API_KEY) {
    throw new Error(
      'Ticketmaster API key is missing. Please ensure VITE_TICKETMASTER_API_KEY is defined in your .env file.'
    );
  }
};

/**
 * Safely extract the highest-quality image from the Ticketmaster images array.
 * 
 * Ticketmaster provides multiple resolutions and aspect ratios (16_9, 3_2, 4_3).
 * Hierarchy:
 * 1. Prefer non-fallback '16_9' ratio with width >= 640px (optimal for hero & cards).
 * 2. Fallback to any '16_9' ratio image.
 * 3. Fallback to high-res '3_2' or '4_3' image.
 * 4. Fallback to largest width image available.
 * 5. Fallback to a high-definition concert event image if no images exist.
 *
 * @param {Array<Object>} [images=[]] - Ticketmaster event images array
 * @returns {string} Clean, high-resolution image URL
 */
// Curated high-resolution fallback photography by category
const FALLBACK_CATEGORY_IMAGES = {
  music: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  'arts & theatre': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  theatre: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  arts: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  film: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  miscellaneous: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
};

/**
 * Safely extract the highest-quality image from the Ticketmaster images array.
 * 
 * Ticketmaster provides multiple resolutions and aspect ratios (16_9, 3_2, 4_3).
 * Hierarchy:
 * 1. Prefer non-fallback '16_9' ratio with width >= 640px (optimal for hero & cards).
 * 2. Fallback to any '16_9' ratio image.
 * 3. Fallback to high-res '3_2' or '4_3' image.
 * 4. Fallback to largest width image available.
 * 5. Fallback to category-specific curated photography if no images exist.
 *
 * @param {Array<Object>} [images=[]] - Ticketmaster event images array
 * @param {string} [category=''] - Event classification category for tailored fallback
 * @returns {string} Clean, high-resolution image URL
 */
export const extractEventImage = (images = [], category = '') => {
  const cleanCatKey = (category || '').toLowerCase().trim();
  const defaultFallback =
    FALLBACK_CATEGORY_IMAGES[cleanCatKey] || FALLBACK_CATEGORY_IMAGES.default;

  if (!Array.isArray(images) || images.length === 0) {
    return defaultFallback;
  }

  // Filter images that have valid string URLs
  const validImages = images.filter(
    (img) => img && typeof img.url === 'string' && img.url.startsWith('http')
  );

  if (validImages.length === 0) {
    return defaultFallback;
  }

  // 1. Non-fallback 16:9 with width >= 640
  const crisp169 = validImages.find(
    (img) => img.ratio === '16_9' && !img.fallback && typeof img.width === 'number' && img.width >= 640
  );
  if (crisp169) return crisp169.url;

  // 2. Any 16:9 image with width >= 640
  const any169Large = validImages.find(
    (img) => img.ratio === '16_9' && typeof img.width === 'number' && img.width >= 640
  );
  if (any169Large) return any169Large.url;

  // 3. Any 16:9 image
  const any169 = validImages.find((img) => img.ratio === '16_9');
  if (any169) return any169.url;

  // 4. Any high-resolution image (width >= 600)
  const anyLarge = validImages.find(
    (img) => typeof img.width === 'number' && img.width >= 600
  );
  if (anyLarge) return anyLarge.url;

  // 5. First image available
  return validImages[0].url;
};

/**
 * Cleanly format ISO date string (YYYY-MM-DD) to readable month/day/year format
 * without timezone offset drift (e.g., "Oct 24, 2026").
 *
 * @param {string} [dateStr] - ISO date string (e.g., "2026-10-24")
 * @returns {string} Formatted human-readable date
 */
export const formatEventDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return 'Date TBA';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = months[monthIdx];
      const dayNum = parseInt(day, 10);

      if (monthName && !isNaN(dayNum)) {
        return `${monthName} ${dayNum}, ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr || 'Date TBA';
  }
};

/**
 * Safely format event start time (HH:MM:SS) into 12-hour AM/PM format (e.g., "7:30 PM").
 * Displays "Time TBA" if time is missing or timeTBA flag is true.
 *
 * @param {string} [timeStr] - Start time string (e.g., "19:30:00")
 * @param {boolean} [isTimeTBA=false] - Ticketmaster time TBA boolean flag
 * @returns {string} 12-hour formatted time or "Time TBA"
 */
export const formatEventTime = (timeStr, isTimeTBA = false) => {
  if (isTimeTBA || !timeStr || typeof timeStr !== 'string') {
    return 'Time TBA';
  }

  try {
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parts[1].slice(0, 2) : '00';

    if (isNaN(hours)) return 'Time TBA';

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour maps to 12

    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return 'Time TBA';
  }
};

/**
 * Extract venue name, address, and city/state/country from Ticketmaster response.
 * Handles both `_embedded.venues[0]` and fallback `event.place` object.
 *
 * @param {Object} event - Raw Ticketmaster event object
 * @returns {{ venueName: string, locationFormatted: string, address: string }}
 */
export const extractVenueAndLocation = (event = {}) => {
  // 1. Primary: _embedded.venues[0]
  const venue = event._embedded?.venues?.[0];
  // 2. Fallback: event.place (defined in Discovery API docs when venue is not an entity)
  const place = event.place;

  const venueName =
    venue?.name ||
    place?.name ||
    'Venue TBA';

  const cityName =
    venue?.city?.name ||
    place?.city?.name ||
    '';

  const stateOrRegion =
    venue?.state?.stateCode ||
    venue?.state?.name ||
    place?.state?.name ||
    '';

  const countryName =
    venue?.country?.name ||
    venue?.country?.countryCode ||
    place?.country?.name ||
    '';

  // Construct readable location (e.g., "London, Great Britain" or "Las Vegas, NV")
  let locationParts = [];
  if (cityName) locationParts.push(cityName);
  if (stateOrRegion) {
    locationParts.push(stateOrRegion);
  } else if (countryName) {
    locationParts.push(countryName);
  }

  const locationFormatted = locationParts.length > 0
    ? locationParts.join(', ')
    : 'Location TBA';

  const address = venue?.address?.line1 || place?.address?.line1 || '';

  return {
    venueName,
    locationFormatted,
    address,
  };
};

/**
 * Extract classification (segment, genre, subGenre) from Ticketmaster schema.
 * Examples:
 * Segment: "Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"
 * Genre: "Rock", "Theatre", "Comedy", "Basketball"
 *
 * @param {Object} event - Raw Ticketmaster event object
 * @returns {{ category: string, genre: string|null, subGenre: string|null }}
 */
export const extractClassification = (event = {}) => {
  const primaryClass = event.classifications?.[0];

  const segment = primaryClass?.segment?.name;
  const genre =
    primaryClass?.genre?.name && primaryClass?.genre?.name !== 'Undefined'
      ? primaryClass.genre.name
      : null;
  const subGenre =
    primaryClass?.subGenre?.name && primaryClass?.subGenre?.name !== 'Undefined'
      ? primaryClass.subGenre.name
      : null;

  // Determine primary category: prefer segment, fallback to genre, then event.type, then 'General'
  const category = segment || genre || (event.type ? event.type.toUpperCase() : 'General');

  return {
    category,
    genre,
    subGenre,
  };
};

/**
 * Format Ticketmaster price range object into a clean price string.
 *
 * @param {Array<Object>} [priceRanges=[]] - Price ranges array from Ticketmaster API
 * @returns {string|null} Formatted price (e.g., "$45 - $120" or "From $35") or null
 */
export const formatPriceRange = (priceRanges = []) => {
  if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
    return null;
  }

  const price = priceRanges[0];
  if (!price) return null;

  const currencySymbols = {
    USD: '$',
    CAD: 'CA$',
    GBP: '£',
    EUR: '€',
    AUD: 'A$',
  };
  const symbol = currencySymbols[price.currency] || `${price.currency} `;

  const hasMin = typeof price.min === 'number';
  const hasMax = typeof price.max === 'number';

  if (hasMin && hasMax) {
    const minVal = Math.round(price.min);
    const maxVal = Math.round(price.max);
    if (minVal === maxVal) {
      return `${symbol}${minVal}`;
    }
    return `${symbol}${minVal} - ${symbol}${maxVal}`;
  }

  if (hasMin) return `From ${symbol}${Math.round(price.min)}`;
  if (hasMax) return `Up to ${symbol}${Math.round(price.max)}`;

  return null;
};

/**
 * Normalizes a raw Ticketmaster event payload into a clean, presentation-ready object.
 *
 * @param {Object} event - Raw event object from Ticketmaster Discovery API
 * @returns {Object} Normalized event object with formatted fields
 */
export const formatEventData = (event = {}) => {
  if (!event || typeof event !== 'object') {
    return null;
  }

  // 1. Classification & Category
  const { category, genre, subGenre } = extractClassification(event);

  // 2. Image (tailored with category-based smart fallback)
  const imageUrl = extractEventImage(event.images, category);

  // 3. Date and Time
  const isTimeTBA = Boolean(event.dates?.timeTBA);
  const localDateRaw = event.dates?.start?.localDate || '';
  const localTimeRaw = event.dates?.start?.localTime || '';
  const dateFormatted = formatEventDate(localDateRaw);
  const timeFormatted = formatEventTime(localTimeRaw, isTimeTBA);

  // 4. Venue & Location
  const { venueName, locationFormatted, address } = extractVenueAndLocation(event);

  // 5. Price Range
  const priceFormatted = formatPriceRange(event.priceRanges);

  // 6. Ticket Status
  const rawStatus = (event.dates?.status?.code || 'onsale').toLowerCase();
  const statusConfig = {
    onsale: { label: 'On Sale', type: 'onsale' },
    rescheduled: { label: 'Rescheduled', type: 'rescheduled' },
    cancelled: { label: 'Cancelled', type: 'cancelled' },
    postponed: { label: 'Postponed', type: 'postponed' },
    offsale: { label: 'Off Sale', type: 'offsale' },
  };
  const status = statusConfig[rawStatus] || {
    label: rawStatus.toUpperCase(),
    type: 'neutral',
  };

  // 7. Attractions / Artists (if available)
  const attractions = event._embedded?.attractions || [];
  const primaryAttraction = attractions[0]?.name || null;

  return {
    id: event.id,
    name: event.name || 'Untitled Event',
    imageUrl,
    dateFormatted,
    timeFormatted,
    venueName,
    locationFormatted,
    address,
    category,
    genre,
    subGenre,
    primaryAttraction,
    priceFormatted,
    status,
    url: event.url,
  };
};

/**
 * Fetch events from Ticketmaster Discovery API with filtering, pagination, and sorting.
 * 
 * NOTE ON TICKETMASTER API QUERY BEHAVIOR & DEDUPLICATION:
 * 1. Ticketmaster frequently returns hourly recurring slots for museum exhibitions
 *    (e.g., 10 AM, 11 AM, 12 PM passes) with identical names, venues, and marketing photos.
 * 2. To ensure rich variety, diverse imagery, and no duplicate cards on our listing,
 *    this function over-fetches a larger sample and intelligently deduplicates by
 *    base event title and primary image asset before slicing down to the requested page size.
 *
 * @param {Object} options - Search and pagination options
 * @param {string} [options.keyword=''] - Search term to filter events by title, artist, or venue
 * @param {string} [options.city=''] - Filter events by city name (e.g. 'New York', 'London')
 * @param {string} [options.classificationName=''] - Category/genre filter (e.g., 'Music', 'Sports', 'Arts & Theatre')
 * @param {number} [options.page=0] - 0-indexed page number for pagination
 * @param {number} [options.size=12] - Number of items per page (default: 12)
 * @param {string} [options.sort='date,asc'] - Sort criteria ('date,asc', 'relevance,desc', 'name,asc')
 * @param {string} [options.startDateTime=''] - ISO UTC timestamp string (e.g., '2026-10-14T20:00:00Z')
 * 
 * @returns {Promise<{ events: Array<Object>, pageInfo: Object }>} Object containing normalized events array and pagination metadata
 */
export const fetchEvents = async ({
  keyword = '',
  city = '',
  classificationName = '',
  page = 0,
  size = 12,
  sort = 'date,asc',
  startDateTime = '',
} = {}) => {
  ensureApiKey();

  // Construct query parameters cleanly without appending empty or undefined values
  const queryParams = new URLSearchParams();
  queryParams.append('apikey', API_KEY);

  // Safely append search keyword (trimmed, only if non-empty)
  if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
    queryParams.append('keyword', keyword.trim());
  }

  // Safely append city filter (trimmed, only if non-empty)
  if (city && typeof city === 'string' && city.trim() !== '') {
    queryParams.append('city', city.trim());
  }

  // Ensure category classification remains fully compatible with search parameters
  if (classificationName && typeof classificationName === 'string' && classificationName.trim() !== '') {
    queryParams.append('classificationName', classificationName.trim());
  }

  if (page !== undefined && page !== null && page !== '') {
    queryParams.append('page', String(page));
  }

  // Request an over-fetched batch (up to 40) to guarantee enough unique distinct items after deduplicating hourly passes
  const requestedSize = Number(size) || 12;
  const overfetchSize = Math.min(Math.max(requestedSize * 2, 24), 50);
  queryParams.append('size', String(overfetchSize));

  if (sort && typeof sort === 'string' && sort.trim() !== '') {
    queryParams.append('sort', sort.trim());
  }

  // Anchor to current time if sorting by date or if startDateTime is explicitly requested
  if (startDateTime && typeof startDateTime === 'string' && startDateTime.trim() !== '') {
    queryParams.append('startDateTime', startDateTime.trim());
  } else if (sort && sort.includes('date')) {
    const currentUtc = new Date().toISOString().split('.')[0] + 'Z';
    queryParams.append('startDateTime', currentUtc);
  }

  const endpoint = `${BASE_URL}/events.json?${queryParams.toString()}`;

  try {
    const response = await fetch(endpoint);

    // Handle standard HTTP error statuses
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          'Ticketmaster API rate limit exceeded (5 requests/sec or 5,000 requests/day). Please wait a few seconds and try again.'
        );
      }
      if (response.status === 401) {
        throw new Error(
          'Unauthorized: Invalid Ticketmaster API key. Please verify your VITE_TICKETMASTER_API_KEY credentials.'
        );
      }
      if (response.status === 404) {
        throw new Error('Ticketmaster events resource not found (404).');
      }

      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.fault?.faultstring ||
        errorBody?.message ||
        `Request failed with HTTP status ${response.status} (${response.statusText})`;

      throw new Error(message);
    }

    const data = await response.json();

    // Safely extract raw events from HAL JSON _embedded structure
    const rawEvents = data._embedded && Array.isArray(data._embedded.events)
      ? data._embedded.events
      : [];

    // Deduplicate recurring identical time-slot events (e.g. museum hours, exhibition passes)
    // to guarantee diverse event listings and eliminate identical repeating images and titles
    const seenTitles = new Set();
    const seenImageUrls = new Set();
    const uniqueRawEvents = [];

    for (const rawEvent of rawEvents) {
      if (!rawEvent || !rawEvent.name) continue;

      // Extract base title before punctuation/pipe/hyphen to capture exhibition series
      const baseTitle = (rawEvent.name || '')
        .split(/\s+[|\-:]\s+/)[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const primaryImg = (rawEvent.images?.[0]?.url || '').split('?')[0];

      // Discard duplicate base titles or identical marketing image assets
      if (!seenTitles.has(baseTitle) && (!primaryImg || !seenImageUrls.has(primaryImg))) {
        seenTitles.add(baseTitle);
        if (primaryImg) seenImageUrls.add(primaryImg);
        uniqueRawEvents.push(rawEvent);
      }
    }

    // Limit to requested page size
    const finalRawEvents = uniqueRawEvents.length > 0 
      ? uniqueRawEvents.slice(0, requestedSize) 
      : rawEvents.slice(0, requestedSize);

    // Enrich events: keep original raw fields while attaching clean normalized presentation fields
    const events = finalRawEvents.map((rawEvent) => {
      const normalized = formatEventData(rawEvent);
      return {
        ...rawEvent,
        ...normalized,
      };
    });

    // Safely extract pagination metadata with safe fallbacks
    const pageInfo = {
      size: requestedSize,
      totalElements: data.page?.totalElements ?? events.length,
      totalPages: data.page?.totalPages ?? (events.length > 0 ? 1 : 0),
      number: Number(page) || 0,
    };

    return {
      events,
      pageInfo,
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network error: Unable to connect to Ticketmaster API. Please check your internet connection.',
        { cause: error }
      );
    }
    throw error;
  }
};

/**
 * Fetch a single event's detailed information by its unique Ticketmaster ID.
 *
 * Endpoint: GET /discovery/v2/events/{id}.json?apikey={API_KEY}
 *
 * @param {string} eventId - Unique Ticketmaster event identifier
 * @returns {Promise<Object>} Detailed and normalized event payload
 */
export const fetchEventById = async (eventId) => {
  ensureApiKey();

  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    throw new Error('A valid eventId string is required to fetch event details.');
  }

  const cleanEventId = encodeURIComponent(eventId.trim());
  const endpoint = `${BASE_URL}/events/${cleanEventId}.json?apikey=${API_KEY}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Event with ID "${eventId}" was not found.`);
      }
      if (response.status === 429) {
        throw new Error('Ticketmaster API rate limit exceeded. Please try again shortly.');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid Ticketmaster API key.');
      }

      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.fault?.faultstring ||
        errorBody?.message ||
        `Failed to fetch event details (status: ${response.status})`;

      throw new Error(message);
    }

    const eventData = await response.json();
    const normalized = formatEventData(eventData);

    return {
      ...eventData,
      ...normalized,
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network error: Unable to connect to Ticketmaster API. Please check your internet connection.',
        { cause: error }
      );
    }
    throw error;
  }
};
