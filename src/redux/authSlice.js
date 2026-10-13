import { createSlice } from '@reduxjs/toolkit';

/**
 * Helper function to safely read and parse JSON items from window.localStorage.
 * Wrapping in try/catch guarantees the application won't crash if localStorage
 * is disabled, restricted by browser security policies, or contains malformed data.
 *
 * @param {string} key - The localStorage storage key to read.
 * @param {*} fallbackValue - The fallback value if key does not exist or JSON parsing fails.
 * @returns {*} The parsed item or fallbackValue.
 */
const getStoredItem = (key, fallbackValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallbackValue;
  } catch (error) {
    console.error(`Error reading "${key}" from localStorage:`, error);
    return fallbackValue;
  }
};

/**
 * -----------------------------------------------------------------------------
 * INITIAL STATE CONFIGURATION
 * -----------------------------------------------------------------------------
 * We hydrate initial state directly from localStorage so that authentication
 * and registration records persist across browser tab refreshes.
 *
 * 1. currentUser:
 *    Retrieved from localStorage ('currentUser'). If previously logged in,
 *    this holds the user object ({ name, email, password }), otherwise null.
 *
 * 2. isAuthenticated:
 *    Boolean flag derived directly from whether `currentUser` exists.
 *
 * 3. error:
 *    Stores error strings (e.g., "Invalid email or password", "User already registered...").
 *    Initialized to null.
 *
 * 4. users:
 *    Array of all registered user objects retrieved from localStorage ('registered_users').
 *    Falls back to an empty array [] if no users have been registered yet.
 */
const initialUser = getStoredItem('currentUser', null);
const initialUsersList = getStoredItem('registered_users', []);

const initialState = {
  currentUser: initialUser,
  isAuthenticated: Boolean(initialUser),
  error: null,
  users: Array.isArray(initialUsersList) ? initialUsersList : [],
};

/**
 * -----------------------------------------------------------------------------
 * AUTHENTICATION SLICE
 * -----------------------------------------------------------------------------
 * createSlice simplifies Redux development:
 * - Automatically generates action creator functions corresponding to reducer names.
 * - Generates action types prefixed with the slice name (e.g., 'auth/registerUser').
 * - Utilizes Immer internally, allowing us to write direct "mutative" code
 *   (e.g., state.users.push(newUser)) while safely generating immutable state updates under the hood.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * registerUser Reducer
     * -------------------------------------------------------------------------
     * Payload expected: { name, email, password }
     *
     * Workflow:
     * 1. Validates if another user with the identical email already exists.
     * 2. If already registered:
     *    - Sets state.error = "User already registered with this email"
     * 3. If new user:
     *    - Constructs new user record and appends to state.users array.
     *    - Saves updated registered users array to localStorage ('registered_users').
     *    - Logs the user in by setting state.currentUser and state.isAuthenticated = true.
     *    - Saves logged in user to localStorage ('currentUser').
     *    - Clears any previous error (state.error = null).
     */
    registerUser: (state, action) => {
      const { name, email, password } = action.payload;

      // Normalize email for case-insensitive comparison
      const normalizedEmail = email ? email.trim().toLowerCase() : '';

      // Check whether a user with this email already exists in state.users
      const existingUser = state.users.find(
        (user) => user.email && user.email.trim().toLowerCase() === normalizedEmail
      );

      if (existingUser) {
        state.error = 'User already registered with this email';
        return;
      }

      // Create new user object
      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        password: password,
      };

      // Append new user to the registered users list
      state.users.push(newUser);

      // Log the user in immediately upon registration
      state.currentUser = newUser;
      state.isAuthenticated = true;
      state.error = null;

      // Persist both registered users and the active user session into localStorage
      try {
        localStorage.setItem('registered_users', JSON.stringify(state.users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
      } catch (err) {
        console.error('Failed to persist registration to localStorage:', err);
      }
    },

    /**
     * loginUser Reducer
     * -------------------------------------------------------------------------
     * Payload expected: { email, password }
     *
     * Workflow:
     * 1. Searches registered users in state.users by matching email and password.
     * 2. If credentials match:
     *    - Sets state.currentUser to the matched user object.
     *    - Sets state.isAuthenticated = true.
     *    - Clears any existing error.
     *    - Persists active session to localStorage ('currentUser').
     * 3. If credentials do not match:
     *    - Sets state.error = "Invalid email or password".
     */
    loginUser: (state, action) => {
      const { email, password } = action.payload;
      const normalizedEmail = email ? email.trim().toLowerCase() : '';

      // Find user matching both email and password
      const matchingUser = state.users.find(
        (user) =>
          user.email &&
          user.email.trim().toLowerCase() === normalizedEmail &&
          user.password === password
      );

      if (matchingUser) {
        state.currentUser = matchingUser;
        state.isAuthenticated = true;
        state.error = null;

        // Persist session to localStorage
        try {
          localStorage.setItem('currentUser', JSON.stringify(matchingUser));
        } catch (err) {
          console.error('Failed to save currentUser to localStorage:', err);
        }
      } else {
        // Set error message for invalid credentials
        state.error = 'Invalid email or password';
      }
    },

    /**
     * logoutUser Reducer
     * -------------------------------------------------------------------------
     * Workflow:
     * 1. Clears current user state (state.currentUser = null).
     * 2. Sets state.isAuthenticated = false.
     * 3. Clears any residual auth errors (state.error = null).
     * 4. Removes 'currentUser' key from localStorage to invalidate the session.
     */
    logoutUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;

      try {
        localStorage.removeItem('currentUser');
      } catch (err) {
        console.error('Failed to remove currentUser from localStorage:', err);
      }
    },

    /**
     * clearAuthError Reducer
     * -------------------------------------------------------------------------
     * Resets authentication error messages (e.g. when navigating between forms
     * or when user edits form input fields).
     */
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

// Export individual action creators generated by createSlice
export const { registerUser, loginUser, logoutUser, clearAuthError } = authSlice.actions;

// Export the reducer function to be mounted in configureStore
export default authSlice.reducer;
