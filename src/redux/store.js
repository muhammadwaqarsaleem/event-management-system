import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import eventsReducer from './eventsSlice';
import registrationsReducer from './registrationsSlice';

/**
 * Redux Store Configuration
 * -----------------------------------------------------------------------------
 * What configureStore does:
 * 1. Automatically combines slice reducers into a single root reducer.
 * 2. Sets up standard Redux middleware by default (including redux-thunk for async
 *    logic and middleware that detects common mutations/serializability mistakes).
 * 3. Automatically enables the Redux DevTools browser extension for streamlined
 *    debugging and time-travel state inspection in development mode.
 * 
 * State Tree Structure:
 * state = {
 *   auth: {
 *     currentUser: Object | null,
 *     isAuthenticated: Boolean,
 *     error: String | null,
 *     users: Array<Object>
 *   },
 *   events: {
 *     events: Array<Object>,
 *     selectedEvent: Object | null,
 *     loading: Boolean,
 *     detailsLoading: Boolean,
 *     error: String | null,
 *     pageInfo: { size, totalElements, totalPages, number }
 *   },
 *   registrations: {
 *     registrations: Array<Object>,
 *     status: 'idle' | 'loading' | 'succeeded' | 'failed',
 *     message: String | null
 *   }
 * }
 */
export const store = configureStore({
  reducer: {
    // Mount the authentication slice reducer under the 'auth' state key
    auth: authReducer,
    // Mount the Ticketmaster events slice reducer under the 'events' state key
    events: eventsReducer,
    // Mount the event registrations slice reducer under the 'registrations' state key
    registrations: registrationsReducer,
  },
});

export default store;

