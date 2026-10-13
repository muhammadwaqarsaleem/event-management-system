import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

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
 *   }
 * }
 */
export const store = configureStore({
  reducer: {
    // Mount the authentication slice reducer under the 'auth' state key
    auth: authReducer,
  },
});

export default store;
