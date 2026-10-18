import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../redux/authSlice';

/**
 * Login Page Component
 * -----------------------------------------------------------------------------
 * Demonstrates:
 * 1. Redux Integration:
 *    - `useDispatch`: Dispatches `loginUser` and `clearAuthError` actions to the Redux store.
 *    - `useSelector`: Selects `isAuthenticated` and `error` from Redux auth slice state.
 * 2. Controlled Form Input handling with local `useState`.
 * 3. Form Validation:
 *    - Checks empty fields, email syntax, and minimum password length before dispatching.
 * 4. Handling Redux Auth Errors:
 *    - Displays "Invalid email or password" or other errors dispatched by the slice.
 * 5. Dynamic Redirection Flow (Step 9):
 *    - Reads `location.state?.from` passed by `ProtectedRoute` or event action buttons.
 *    - As soon as login succeeds, user is smoothly navigated back to their intended
 *      previous page (e.g., `/my-events` or `/events/:id`) instead of a hardcoded `/`.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Extract auth slice state from the Redux store
  const { isAuthenticated, error: authError } = useSelector((state) => state.auth);

  // If user navigated with state (e.g. from registration redirect), prefill email
  const initialEmail = location.state?.registeredEmail || '';

  // Determine intended redirect destination from location.state
  const fromLocation = location.state?.from;
  const redirectPath =
    typeof fromLocation === 'string'
      ? fromLocation
      : fromLocation?.pathname
      ? `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`
      : '/';

  // ---------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // ---------------------------------------------------------------------------

  // Controlled input fields
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
  });

  // Stores field-specific client validation error messages
  const [errors, setErrors] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. LIFECYCLE & REDIRECTION
  // ---------------------------------------------------------------------------

  /**
   * Automatically redirects user to intended destination (or Home '/') once authenticated.
   * Runs whenever `isAuthenticated` changes (e.g. upon successful login)
   * or if user enters /login while already logged in.
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  /**
   * Cleanup effect: Clears any lingering auth errors when component unmounts.
   */
  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  // ---------------------------------------------------------------------------
  // 3. INPUT CHANGE HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles user keystrokes for input fields.
   * Dynamically updates `formData`, removes field errors, and clears Redux auth error.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear individual field error as user types
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }

    // Clear Redux auth error if active
    if (authError) {
      dispatch(clearAuthError());
    }
  };

  // ---------------------------------------------------------------------------
  // 4. FORM VALIDATION LOGIC
  // ---------------------------------------------------------------------------

  /**
   * Validates email and password fields.
   * Returns an object mapping field names to error messages.
   */
  const validateForm = () => {
    const newErrors = {};

    // 1. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // 2. Password Validation
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    return newErrors;
  };

  // ---------------------------------------------------------------------------
  // 5. FORM SUBMIT HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles login submission:
   * 1. Prevents default form submission.
   * 2. Clears previous errors.
   * 3. Validates inputs locally.
   * 4. Dispatches `loginUser` action to Redux store.
   *    - If credentials match: Redux sets currentUser and isAuthenticated = true,
   *      persisting to localStorage. The useEffect then redirects to intended redirectPath.
   *    - If credentials fail: Redux sets state.error ("Invalid email or password"),
   *      which is displayed in the alert banner.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (authError) {
      dispatch(clearAuthError());
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Dispatch login action to Redux auth slice
    dispatch(
      loginUser({
        email: formData.email.trim(),
        password: formData.password,
      })
    );

    setIsSubmitting(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Header Section */}
        <div className="auth-header">
          <span className="auth-badge">Welcome Back</span>
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">
            {fromLocation
              ? 'Please sign in to access your requested page.'
              : 'Enter your credentials to access your EventVerse account.'}
          </p>
        </div>

        {/* Informational notice when redirected from a protected route */}
        {fromLocation && !authError && (
          <div className="alert alert-info" role="status">
            <span className="alert-icon">🔒</span>
            <span>Authentication required. You will be redirected after signing in.</span>
          </div>
        )}

        {/* Redux Authentication Error Banner (e.g. "Invalid email or password") */}
        {authError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{authError}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Address Input */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email Address <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="e.g. john@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email || authError ? 'has-error' : ''}`}
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="error-text" role="alert">
                <span>⚠️</span> {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password || authError ? 'has-error' : ''}`}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="error-text" role="alert">
                <span>⚠️</span> {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Navigation Link to Register */}
        <div className="auth-footer">
          Don't have an account?{' '}
          <Link
            to="/register"
            state={fromLocation ? { from: fromLocation } : undefined}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
