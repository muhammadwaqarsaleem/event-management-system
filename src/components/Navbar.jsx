import { NavLink, Link } from 'react-router-dom';

/**
 * Navbar Component
 * 
 * Demonstrates:
 * 1. React Router v6 navigation using <NavLink> and <Link>.
 * 2. Dynamic class toggling based on the `isActive` boolean parameter.
 *    - Unlike regular <a> tags which trigger a full browser refresh, <NavLink> performs
 *      seamless client-side routing without reloading the page.
 * 3. Modern, responsive navigation bar layout for the EventVerse application.
 */
function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo / Title */}
        {/* Using <Link> so clicking the logo navigates back to Home smoothly */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon" role="img" aria-label="EventVerse Logo">
            📅
          </span>
          <span>
            Event<span className="brand-accent">Verse</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav aria-label="Primary Navigation">
          <ul className="navbar-links">
            <li>
              {/*
                NavLink provides a function in `className` that receives an object: { isActive, isPending }.
                When the current URL matches `to="/"`, `isActive` becomes true.
                The 'end' prop ensures '/' only matches exactly the root path, not sub-routes.
              */}
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

            <li>
              {/* NavLink to Login page */}
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
              {/* NavLink to Register page - styled as a prominent call-to-action */}
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
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
