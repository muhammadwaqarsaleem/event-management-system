import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError } from '../redux/authSlice';

/**
 * Register Page Component
 * -----------------------------------------------------------------------------
 * Demonstrates:
 * 1. Redux Integration with React:
 *    - `useDispatch`: Hook providing the Redux dispatch function to send actions to the store.
 *    - `useSelector`: Hook to extract pieces of state (`isAuthenticated`, `error`) from the Redux store.
 * 2. Controlled Form Components in React using local state (`useState`).
 * 3. Client-Side Validation:
 *    - Checks empty/whitespace fields, email regex pattern, password length (>= 6),
 *      and password confirmation equality before dispatching to Redux.
 * 4. Error and Status Display:
 *    - Displays client-side validation errors under input fields.
 *    - Displays Redux-managed errors (e.g., "User already registered with this email")
 *      in the top alert banner.
 * 5. Automatic Redirection:
 *    - `useEffect` monitors `isAuthenticated` from Redux. As soon as the user is
 *      registered and logged in, they are redirected automatically to the home page (`/`).
 */
function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Extract auth slice state from the Redux store
  const { isAuthenticated, error: authError } = useSelector((state) => state.auth);

  // ---------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // ---------------------------------------------------------------------------

  // Local form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Client-side field-level validation errors
  const [errors, setErrors] = useState({});

  // Local UI status flags
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. LIFECYCLE & REDIRECTION
  // ---------------------------------------------------------------------------

  /**
   * Automatically redirects user to Home ('/') if authenticated.
   * Runs whenever `isAuthenticated` changes (e.g. following successful registration)
   * or if the user navigates to /register while already logged in.
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Cleanup effect: Clears any lingering Redux auth errors when component unmounts.
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
   * Handles user input keystrokes.
   * Updates local state, clears field-level validation errors, and clears Redux auth errors.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear field-level error as user types
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
  // 4. FORM VALIDATION
  // ---------------------------------------------------------------------------

  /**
   * Validates form inputs against assignment requirements.
   * Returns an object mapping invalid field names to error messages.
   */
  const validateForm = () => {
    const newErrors = {};

    // 1. Full Name: Must not be empty and at least 2 characters
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }

    // 2. Email: Must match standard email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    // 3. Password: Must be at least 6 characters
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    // 4. Confirm Password: Must match password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  // ---------------------------------------------------------------------------
  // 5. FORM SUBMISSION HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles registration form submission:
   * 1. Prevents default browser reload.
   * 2. Runs local client validation.
   * 3. Dispatches `registerUser` action to Redux store.
   *    - If user exists: Redux sets state.error which displays in the alert banner.
   *    - If valid: Redux updates state.users, sets state.currentUser, updates localStorage,
   *      and sets state.isAuthenticated = true, triggering the useEffect redirect to '/'.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear Redux errors prior to submission attempt
    if (authError) {
      dispatch(clearAuthError());
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Dispatch registerUser action to the Redux store
    dispatch(
      registerUser({
        name: formData.name.trim(),
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
          <span className="auth-badge">Join EventVerse</span>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">
            Sign up to discover and register for events seamlessly.
          </p>
        </div>

        {/* Redux Authentication Error Banner (e.g., email already exists) */}
        {authError && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{authError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name Input */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                disabled={isSubmitting}
                autoComplete="name"
              />
            </div>
            {errors.name && (
              <p className="error-text" role="alert">
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>

          {/* Email Address Input */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="email"
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
            <label htmlFor="password" className="form-label">
              Password <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'has-error' : ''}`}
                disabled={isSubmitting}
                autoComplete="new-password"
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

          {/* Confirm Password Input */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="required-star">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'has-error' : ''}`}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text" role="alert">
                <span>⚠️</span> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Footer Navigation Link to Login */}
        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
