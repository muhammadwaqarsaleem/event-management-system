import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice';

/**
 * Navbar Component
 * -----------------------------------------------------------------------------
 * Demonstrates:
 * 1. Redux State Access with `useSelector`:
 *    - Reads `isAuthenticated` and `currentUser` from Redux auth slice state.
 * 2. Redux Action Dispatching with `useDispatch`:
 *    - Dispatches `logoutUser` to clear session state in Redux and delete
 *      `currentUser` from `localStorage`.
 * 3. Conditional Rendering based on Authentication State:
 *    - When authenticated:
 *        * Renders a personalized greeting ("Hi, [Name]").
 *        * Renders a "Logout" button.
 *        * Hides "Login" and "Register" links.
 *    - When unauthenticated:
 *        * Renders "Login" and "Register" navigation links.
 *        * Hides the Logout button and user greeting.
 * 4. Client-side navigation using React Router v6 `<NavLink>` and `<Link>`.
 */
function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Extract auth state from the Redux store
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);

  /**
   * Handles user logout:
   * 1. Dispatches `logoutUser()` which removes currentUser from Redux state and localStorage.
   * 2. Programmatically redirects the user to the login page ('/login') for optimal UX.
   */
  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo / Title */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon" role="img" aria-label="EventVerse Logo">
            📅
          </span>
          <span>
            Event<span className="brand-accent">Verse</span>
          </span>
        </Link>

        {/* Navigation Links & Auth Controls */}
        <nav aria-label="Primary Navigation">
          <ul className="navbar-links">
            {/* Always visible: Home link */}
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
              >
                Home
              </NavLink>
            </li>

            {/* Conditional Rendering Based on Redux Authentication State */}
            {isAuthenticated ? (
              // ---------------------------------------------------------------
              // AUTHENTICATED STATE:
              // - Show personalized greeting: "Hi, [Name]"
              // - Show Logout action button
              // - Hide Login and Register links
              // ---------------------------------------------------------------
              <>
                <li className="navbar-user">
                  <span className="navbar-greeting">
                    👋 Hi, <span className="navbar-user-name">{currentUser?.name || 'User'}</span>
                  </span>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="logout-btn"
                    aria-label="Log out of EventVerse"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              // ---------------------------------------------------------------
              // UNAUTHENTICATED STATE:
              // - Show Login & Register links
              // - Hide Logout button and greeting
              // ---------------------------------------------------------------
              <>
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      isActive ? 'nav-link active' : 'nav-link'
                    }
                  >
                    Login
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/register"
                    className={({ isActive }) =>
                      isActive
                        ? 'nav-link nav-link-cta active'
                        : 'nav-link nav-link-cta'
                    }
                  >
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
