import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchEvents, fetchEventById } from '../services/ticketmasterApi';

/**
 * =============================================================================
 * ASYNC THUNKS (TICKETMASTER API ACTIONS)
 * =============================================================================
 * createAsyncThunk abstracts Redux action dispatching for asynchronous flows:
 * 1. Automatically dispatches a pending action before executing the payload creator.
 * 2. If the promise resolves, dispatches a fulfilled action with returned data.
 * 3. If an error is thrown or rejectWithValue is called, dispatches a rejected action.
 * -----------------------------------------------------------------------------
 */

/**
 * Async thunk to search and fetch events from Ticketmaster.
 * 
 * @param {Object} [params={}] - Optional query parameters (keyword, classificationName, page, size, sort)
 * @param {Object} thunkAPI - Redux Toolkit thunk API object containing dispatch, getState, rejectWithValue, etc.
 */
export const getEvents = createAsyncThunk(
  'events/getEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await fetchEvents(params);
      // Returns { events: Array, pageInfo: Object }
      return response;
    } catch (error) {
      // Use rejectWithValue to capture user-friendly error messages in rejected action payload
      return rejectWithValue(
        error.message || 'Failed to fetch events from Ticketmaster.'
      );
    }
  }
);

/**
 * Async thunk to fetch complete details of a specific event by ID.
 * 
 * @param {string} eventId - Unique Ticketmaster event identifier
 * @param {Object} thunkAPI - Redux Toolkit thunk API object
 */
export const getEventDetails = createAsyncThunk(
  'events/getEventDetails',
  async (eventId, { rejectWithValue }) => {
    try {
      const eventData = await fetchEventById(eventId);
      return eventData;
    } catch (error) {
      return rejectWithValue(
        error.message || `Failed to fetch details for event ID: ${eventId}`
      );
    }
  }
);

/**
 * =============================================================================
 * INITIAL STATE CONFIGURATION
 * =============================================================================
 * - events: Array of event objects returned by Ticketmaster API
 * - selectedEvent: Object storing full details for the currently viewed event
 * - loading: Boolean tracking active event list search/fetch requests
 * - detailsLoading: Boolean tracking active single-event detail fetch requests
 * - error: Stores error messages from rejected API thunk requests or null
 * - pageInfo: Holds Ticketmaster pagination metadata (size, total elements, page number)
 */
const initialState = {
  events: [],
  selectedEvent: null,
  loading: false,
  detailsLoading: false,
  error: null,
  pageInfo: {
    size: 20,
    totalElements: 0,
    totalPages: 0,
    number: 0,
  },
};

/**
 * =============================================================================
 * EVENTS REDUX SLICE
 * =============================================================================
 */
export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    /**
     * Synchronous reducer to clear the currently selected event details.
     * Useful when navigating away from event details view.
     */
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // -------------------------------------------------------------------------
    // getEvents Lifecycle Handlers
    // -------------------------------------------------------------------------
    builder
      // 1. Pending: Network request initiated
      .addCase(getEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 2. Fulfilled: Successful API response received
      .addCase(getEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.pageInfo = action.payload.pageInfo;
        state.error = null;
      })
      // 3. Rejected: API error or network failure
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'An error occurred while loading events.';
      })

    // -------------------------------------------------------------------------
    // getEventDetails Lifecycle Handlers
    // -------------------------------------------------------------------------
      // 1. Pending: Single event detail request initiated
      .addCase(getEventDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      // 2. Fulfilled: Single event detail received
      .addCase(getEventDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedEvent = action.payload;
        state.error = null;
      })
      // 3. Rejected: Single event detail request failed
      .addCase(getEventDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload || action.error.message || 'Failed to load event details.';
      });
  },
});

// Export synchronous actions
export const { clearSelectedEvent } = eventsSlice.actions;

// Export default slice reducer for root store registration
export default eventsSlice.reducer;
