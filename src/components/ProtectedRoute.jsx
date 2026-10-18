import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * =============================================================================
 * Step 9: Add Protected Routes
 *
 * Guard component that restricts access to authenticated users only.
 *
 * Behavior:
 * 1. Reads `isAuthenticated` from Redux `auth` slice.
 * 2. If `isAuthenticated` is true:
 *    - Renders passed `children` or React Router v6 `<Outlet />` for child routes.
 * 3. If `isAuthenticated` is false:
 *    - Renders `<Navigate to="/login" state={{ from: location }} replace />`
 *    - Preserves current `location` in navigation state so `Login.jsx` can seamlessly
 *      route the user back to the exact intended destination upon authenticating.
 * =============================================================================
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Child components to render when authorized
 * @returns {JSX.Element}
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login while preserving intended path in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Support both component wrapping (<ProtectedRoute><Child /></ProtectedRoute>)
  // and route nesting (<Route element={<ProtectedRoute />}><Route ... /></Route>)
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
