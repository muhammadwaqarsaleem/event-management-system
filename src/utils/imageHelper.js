/**
 * Image Helper Utility
 * =============================================================================
 * Provides a deterministic, single source of truth for selecting and formatting
 * Ticketmaster event images across all components (EventCard, EventDetails,
 * Registrations Redux slice, and MyEvents).
 *
 * Root Cause Analysis & Solution:
 * -----------------------------------------------------------------------------
 * Problem:
 * Ticketmaster Discovery API returns 10+ image variations with differing aspect
 * ratios (16_9, 3_2, 4_3) and resolutions per event. Previously, listing,
 * details, and registration storage used different selection heuristics
 * (or arbitrary indices like images[0]), resulting in image mismatches between
 * browsing cards and registered event tickets.
 *
 * Deterministic Algorithm:
 * 1. Check if `event.images` exists and is a non-empty array.
 * 2. Step A: Filter images where `ratio === '16_9'` and sort descending by `width`.
 *    Select the highest resolution one (e.g., width >= 640).
 * 3. Step B: If no 16_9 image exists, sort all available valid images by `width`
 *    descending and select the largest one.
 * 4. Step C: If no valid image URL is found, return an optimized SVG Data URI
 *    placeholder that renders instantly without external network dependencies.
 * =============================================================================
 */

/**
 * High-quality 16:9 Event Placeholder Data URI.
 * Renders an inline SVG featuring a modern gradient and ticket icon.
 */
export const DEFAULT_EVENT_PLACEHOLDER =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201280%20720%22%20width%3D%221280%22%20height%3D%22720%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230f172a%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%231e1b4b%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23312e81%22%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%22glow%22%20cx%3D%2250%25%22%20cy%3D%2240%22%20r%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22rgba(99%2C%20102%2C%20241%2C%200.35)%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22rgba(15%2C%2023%2C%2042%2C%200)%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23bg)%22%2F%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23glow)%22%2F%3E%3Ccircle%20cx%3D%22640%22%20cy%3D%22300%22%20r%3D%2270%22%20fill%3D%22rgba(255%2C%20255%2C%20255%2C%200.08)%22%2F%3E%3Ctext%20x%3D%22640%22%20y%3D%22325%22%20text-anchor%3D%22middle%22%20font-size%3D%2264%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2CRoboto%2Csans-serif%22%3E%F0%9F%8E%AB%3C%2Ftext%3E%3Ctext%20x%3D%22640%22%20y%3D%22420%22%20text-anchor%3D%22middle%22%20font-size%3D%2232%22%20font-weight%3D%22700%22%20fill%3D%22%23ffffff%22%20letter-spacing%3D%221%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2CRoboto%2Csans-serif%22%3EEventVerse%3C%2Ftext%3E%3Ctext%20x%3D%22640%22%20y%3D%22460%22%20text-anchor%3D%22middle%22%20font-size%3D%2218%22%20font-weight%3D%22500%22%20fill%3D%22%23a5b4fc%22%20font-family%3D%22-apple-system%2CBlinkMacSystemFont%2CSegoe%20UI%2CRoboto%2Csans-serif%22%3ELive%20Event%20Experience%3C%2Ftext%3E%3C%2Fsvg%3E';

/**
 * Deterministically extracts the highest-quality 16:9 image URL from an event.
 *
 * @param {Object} event - Raw Ticketmaster event or normalized event object
 * @returns {string} Fully qualified image URL or fallback SVG Data URI
 */
export const getEventImage = (event) => {
  if (!event) {
    return DEFAULT_EVENT_PLACEHOLDER;
  }

  // Handle both raw event objects with `event.images` and pre-extracted image arrays
  const images = Array.isArray(event)
    ? event
    : Array.isArray(event?.images)
    ? event.images
    : null;

  if (images && images.length > 0) {
    // Filter to items that have a non-empty string URL
    const validImages = images.filter(
      (img) =>
        img &&
        typeof img.url === 'string' &&
        img.url.trim().length > 0
    );

    if (validImages.length > 0) {
      // Step A: Filter images where img.ratio === '16_9' and sort descending by width
      const sixteenNineImages = validImages
        .filter((img) => img.ratio === '16_9' || img.ratio === '16:9')
        .sort((a, b) => (Number(b.width) || 0) - (Number(a.width) || 0));

      if (sixteenNineImages.length > 0) {
        return sixteenNineImages[0].url;
      }

      // Step B: If no 16_9 image exists, sort all available images by width descending
      const allSorted = [...validImages].sort(
        (a, b) => (Number(b.width) || 0) - (Number(a.width) || 0)
      );

      if (allSorted.length > 0) {
        return allSorted[0].url;
      }
    }
  }

  // Secondary Fallback: Check if event already has a valid normalized string property
  if (typeof event.imageUrl === 'string' && event.imageUrl.trim().length > 0) {
    return event.imageUrl.trim();
  }

  if (typeof event.eventImage === 'string' && event.eventImage.trim().length > 0) {
    return event.eventImage.trim();
  }

  // Step C: If no valid image URL is found, return reliable placeholder SVG
  return DEFAULT_EVENT_PLACEHOLDER;
};

export default getEventImage;
