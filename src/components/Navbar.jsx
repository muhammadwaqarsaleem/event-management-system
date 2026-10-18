import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice';

/**
 * Navbar Component
 * -----------------------------------------------------------------------------
 * Responsive Navigation Bar featuring:
 * 1. Redux State Access with `useSelector`:
 *    - Reads `isAuthenticated` and `currentUser` from Redux auth slice state.
 *    - Reads `registrations` to compute active upcoming registration count badge.
 * 2. Redux Action Dispatching with `useDispatch`:
 *    - Dispatches `logoutUser` to clear session state in Redux and delete
 *      `currentUser` from `localStorage`.
 * 3. Mobile Hamburger Menu Toggle (Screens < 768px):
 *    - Responsive hamburger icon with smooth animated transition to an 'X' icon.
 *    - Toggles mobile navigation overlay/dropdown containing all navigation items.
 *    - Automatically closes when any navigation link is clicked or route changes.
 *    - Closes on backdrop click or when the Escape key is pressed.
 * 4. Conditional Rendering based on Authentication State:
 *    - When authenticated:
 *        * Shows personalized greeting ("Hi, [Name]").
 *        * Shows "My Events" link with upcoming active registration badge count.
 *        * Shows "Logout" action button.
 *        * Hides "Login" and "Register" links.
 *    - When unauthenticated:
 *        * Shows "Login" and "Register" navigation links.
 *        * Hides Logout button, My Events, and user greeting.
 * 5. Accessible semantics (`aria-expanded`, `aria-controls`, `aria-label`).
 */
function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // State to toggle mobile hamburger menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Extract auth and registration slice states from the Redux store
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const { registrations = [] } = useSelector((state) => state.registrations);

  // React 19 recommendation: adjust state during render instead of in useEffect
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsMobileMenuOpen(false);
  }

  /**
   * Accessibility: Close mobile menu when the Escape key is pressed
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  /**
   * Helper callbacks to manage mobile menu state
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /**
   * Calculates the user's active upcoming event registrations:
   * 1. Filters registrations belonging to the authenticated user's email.
   * 2. Parses event date to local midnight and checks if it is >= today.
   */
  const todayMidnight = new Date().setHours(0, 0, 0, 0);
  const normalizedUserEmail = currentUser?.email?.trim().toLowerCase();

  const upcomingCount =
    isAuthenticated && normalizedUserEmail
      ? registrations.filter((reg) => {
          if (!reg.userEmail || reg.userEmail.trim().toLowerCase() !== normalizedUserEmail) {
            return false;
          }
          if (!reg.eventDate || reg.eventDate === 'TBA') return true;
          const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.test(reg.eventDate);
          if (ymdMatch) {
            const [year, month, day] = reg.eventDate.split('-').map(Number);
            return new Date(year, month - 1, day).setHours(0, 0, 0, 0) >= todayMidnight;
          }
          const parsed = new Date(reg.eventDate);
          return !isNaN(parsed.getTime())
            ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).setHours(0, 0, 0, 0) >= todayMidnight
            : true;
        }).length
      : 0;

  /**
   * Handles user logout:
   * 1. Closes mobile drawer if open.
   * 2. Dispatches `logoutUser()` which clears currentUser from Redux state and localStorage.
   * 3. Programmatically redirects the user to the login page ('/login').
   */
  const handleLogout = () => {
    closeMobileMenu();
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo / Title */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="brand-icon" role="img" aria-label="EventVerse Logo">
            📅
          </span>
          <span>
            Event<span className="brand-accent">Verse</span>
          </span>
        </Link>

        {/* Mobile Hamburger Menu Toggle Button (Visible on screens < 768px) */}
        <button
          type="button"
          className={`navbar-hamburger ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
        >
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
          <span className="hamburger-line" aria-hidden="true" />
        </button>

        {/* Navigation Links & Auth Controls (Desktop row & Mobile dropdown) */}
        <nav
          id="primary-navigation"
          aria-label="Primary Navigation"
          className={`navbar-nav ${isMobileMenuOpen ? 'nav-open' : ''}`}
        >
          <ul className="navbar-links">
            {/* Always visible: Home link */}
            <li>
              <NavLink
                to="/"
                end
                onClick={closeMobileMenu}
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
              // - Show "My Events" link with upcoming active registration badge count
              // - Show personalized greeting: "Hi, [Name]"
              // - Show Logout action button
              // - Hide Login and Register links
              // ---------------------------------------------------------------
              <>
                <li>
                  <NavLink
                    to="/my-events"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      isActive
                        ? 'nav-link nav-link-my-events active'
                        : 'nav-link nav-link-my-events'
                    }
                  >
                    <span>My Events</span>
                    {upcomingCount > 0 && (
                      <span
                        className="navbar-badge-count"
                        title={`${upcomingCount} upcoming registered ${
                          upcomingCount === 1 ? 'event' : 'events'
                        }`}
                        aria-label={`${upcomingCount} upcoming registrations`}
                      >
                        {upcomingCount}
                      </span>
                    )}
                  </NavLink>
                </li>

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
                    onClick={closeMobileMenu}
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
                    onClick={closeMobileMenu}
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

      {/* Backdrop overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="navbar-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default Navbar;
