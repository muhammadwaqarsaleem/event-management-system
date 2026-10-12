import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * Login Page Component
 * 
 * Demonstrates:
 * 1. Controlled component state management using `useState`.
 * 2. Form input validation:
 *    - Required field checks.
 *    - Valid email formatting with Regex.
 *    - Minimum password length check (>= 6 characters).
 * 3. Handling route state from React Router (`useLocation().state`):
 *    - If user was redirected from the Register page, their email is automatically
 *      pre-filled for a seamless user experience.
 * 4. Inline error indicators and visual feedback.
 * 5. Simulated authentication request with a delay and redirect to `/` (Home).
 */
function Login() {
  // Navigation hooks from React Router v6
  const navigate = useNavigate();
  const location = useLocation();

  // If the user arrived here from Register.jsx, prefill their email
  const initialEmail = location.state?.registeredEmail || '';

  // ---------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // ---------------------------------------------------------------------------

  // Controlled input fields
  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
  });

  // Stores field-specific error messages
  const [errors, setErrors] = useState({});

  // Form submission and alert states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registeredEmail
      ? 'Account created successfully! Please log in with your credentials.'
      : ''
  );

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. INPUT CHANGE HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles user keystrokes for input fields.
   * Dynamically updates `formData` and removes field errors on edit.
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

    // Clear top banners
    if (formAlert) setFormAlert('');
  };

  // ---------------------------------------------------------------------------
  // 3. FORM VALIDATION LOGIC
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
  // 4. FORM SUBMIT HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles login submission:
   * - Validates form inputs.
   * - Simulates an authentication handshake.
   * - Directs the user to the homepage (`/`) upon success.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Reset error banners
    setFormAlert('');

    // Execute validation
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormAlert('Please fix the errors highlighted below.');
      return;
    }

    // Start submission state
    setIsSubmitting(true);

    // Simulate authentication API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage('Login successful! Redirecting to dashboard...');

      // Redirect to Home page after short delay
      setTimeout(() => {
        navigate('/');
      }, 1200);
    }, 1000);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Header Section */}
        <div className="auth-header">
          <span className="auth-badge">Welcome Back</span>
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">
            Enter your credentials to access your EventVerse account.
          </p>
        </div>

        {/* Global Error Alert Banner */}
        {formAlert && (
          <div className="alert alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{formAlert}</span>
          </div>
        )}

        {/* Global Success Alert Banner */}
        {successMessage && (
          <div className="alert alert-success" role="status">
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
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
                className={`form-input ${errors.email ? 'has-error' : ''}`}
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
                className={`form-input ${errors.password ? 'has-error' : ''}`}
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
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
