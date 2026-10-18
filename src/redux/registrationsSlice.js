import { createSlice } from '@reduxjs/toolkit';
import { getEventImage } from '../utils/imageHelper';

/**
 * Event Registrations Slice
 * =============================================================================
 * Handles event registration state management, duplicate registration prevention,
 * local storage synchronization, and cancellation workflows for EventVerse.
 *
 * Architecture & Design Decisions:
 * -----------------------------------------------------------------------------
 * 1. Redux Toolkit (RTK) `createSlice`:
 *    - Simplifies reducer logic using Immer library under the hood, enabling
 *      direct mutable syntax (e.g., `state.registrations.push(...)`) while
 *      producing immutable state updates behind the scenes.
 *    - Automatically generates action creators with corresponding action types.
 *
 * 2. Deterministic Image Persistence (Step 9):
 *    - Uses centralized `getEventImage(event)` so that registered items stored
 *      in `localStorage` persist the exact same 16:9 banner image seen on
 *      the event card and details views.
 *
 * 3. Persistent Storage (localStorage):
 *    - Key: `'event_registrations'`
 *    - Hydrated synchronously during slice definition so registrations survive
 *      browser page refreshes and tab reloads.
 *    - Synchronized whenever a user registers for or cancels an event.
 *
 * 4. Robust Error Handling:
 *    - Safe JSON parsing helper `getStoredRegistrations()` protects against
 *      corrupted JSON or restricted environments.
 * =============================================================================
 */

/**
 * Safely retrieves and parses persisted registrations from window.localStorage.
 *
 * @returns {Array<Object>} List of registration objects, or [] if empty/invalid.
 */
const getStoredRegistrations = () => {
  try {
    const rawData = localStorage.getItem('event_registrations');
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse "event_registrations" from localStorage:', error);
    return [];
  }
};

/**
 * Initial Redux State:
 * - `registrations`: Array of persisted event registration objects.
 * - `status`: 'idle' | 'loading' | 'succeeded' | 'failed'
 * - `message`: String notification message or null for user feedback toasts.
 */
const initialState = {
  registrations: getStoredRegistrations(),
  status: 'idle',
  message: null,
};

export const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    /**
     * Registers a logged-in user for an event.
     * Checks for duplicate registration (identical userEmail and eventId).
     * If unique, creates a record, appends to state, and persists to localStorage.
     *
     * @param {Object} state - Current registrations slice state.
     * @param {Object} action - Action with payload { userEmail: string, event: Object }.
     */
    registerEvent: (state, action) => {
      const { userEmail, event } = action.payload || {};

      if (!userEmail || !event || !event.id) {
        state.status = 'failed';
        state.message = 'Unable to complete registration. Missing user or event details.';
        return;
      }

      // Check if registration already exists for this user and event
      const alreadyRegistered = state.registrations.some(
        (reg) => reg.userEmail === userEmail && reg.eventId === event.id
      );

      if (alreadyRegistered) {
        state.status = 'failed';
        state.message = 'You are already registered for this event.';
        return;
      }

      // Construct normalized registration record with deterministic 16:9 image
      const newRegistration = {
        registrationId: Date.now().toString(),
        userEmail,
        eventId: event.id,
        eventTitle: event.name || 'Untitled Event',
        eventDate: event.dates?.start?.localDate || event.dateFormatted || 'TBA',
        eventTime: event.dates?.start?.localTime || event.timeFormatted || 'TBA',
        eventImage: getEventImage(event),
        venueName:
          event._embedded?.venues?.[0]?.name ||
          event.venueName ||
          'Venue TBA',
        venueCity:
          event._embedded?.venues?.[0]?.city?.name ||
          event.city ||
          '',
        registeredAt: new Date().toISOString(),
      };

      // Push to in-memory state (Immer creates an immutable clone)
      state.registrations.push(newRegistration);
      state.status = 'succeeded';

      // Persist updated list to localStorage
      try {
        localStorage.setItem(
          'event_registrations',
          JSON.stringify(state.registrations)
        );
      } catch (storageError) {
        console.error('Failed to save registration to localStorage:', storageError);
      }

      // Set user feedback notification message
      state.message = `Successfully registered for ${event.name || 'event'}.`;
    },

    /**
     * Cancels an existing event registration for a user.
     * Filters out the record matching userEmail and eventId, then updates localStorage.
     *
     * @param {Object} state - Current registrations slice state.
     * @param {Object} action - Action with payload { userEmail: string, eventId: string }.
     */
    cancelEventRegistration: (state, action) => {
      const { userEmail, eventId } = action.payload || {};

      if (!userEmail || !eventId) {
        state.status = 'failed';
        state.message = 'Unable to cancel registration. Missing user or event ID.';
        return;
      }

      const initialLength = state.registrations.length;
      state.registrations = state.registrations.filter(
        (reg) => !(reg.userEmail === userEmail && reg.eventId === eventId)
      );

      // Only sync and update message if a match was actually removed
      if (state.registrations.length < initialLength) {
        try {
          localStorage.setItem(
            'event_registrations',
            JSON.stringify(state.registrations)
          );
        } catch (storageError) {
          console.error('Failed to update localStorage after cancellation:', storageError);
        }
        state.status = 'succeeded';
        state.message = 'Registration successfully cancelled.';
      } else {
        state.status = 'failed';
        state.message = 'No matching registration found to cancel.';
      }
    },

    /**
     * Clears feedback notification message.
     * Useful for auto-dismissing toast banners or closing via an explicit UI dismiss button.
     *
     * @param {Object} state - Current registrations slice state.
     */
    clearRegistrationMessage: (state) => {
      state.message = null;
    },
  },
});

export const {
  registerEvent,
  cancelEventRegistration,
  clearRegistrationMessage,
} = registrationsSlice.actions;

export default registrationsSlice.reducer;
