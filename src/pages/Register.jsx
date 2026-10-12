import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Register Page Component
 * 
 * Demonstrates:
 * 1. Controlled Form Components in React using local state (`useState`).
 * 2. Robust Client-Side Validation:
 *    - Checks for empty/whitespace-only fields.
 *    - Validates email syntax using standard Regex pattern.
 *    - Enforces minimum password length (>= 6 characters).
 *    - Ensures Password and Confirm Password match.
 * 3. Dynamic error display:
 *    - Inline error messages beneath each invalid input field.
 *    - Red border highlighting on inputs failing validation.
 *    - Top alert banner for immediate feedback.
 * 4. Asynchronous form submission simulation:
 *    - Disables submit button during submission to prevent duplicate requests.
 *    - Displays success alert banner.
 * 5. Programmatic navigation using React Router v6 `useNavigate()` to route the user
 *    to the `/login` page upon successful registration.
 */
function Register() {
  // Hook provided by React Router v6 for programmatic redirection
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 1. STATE DEFINITIONS
  // ---------------------------------------------------------------------------

  // formData: Holds the controlled input values for each form field
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // errors: Stores inline validation error messages keyed by input name
  const [errors, setErrors] = useState({});

  // Form submission feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formAlert, setFormAlert] = useState('');

  // Password visibility toggle states for better user experience
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. INPUT CHANGE HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles user typing into any input field.
   * Uses computed property name `[name]: value` to update state dynamically.
   * Also clears any existing error for that field to provide real-time responsive feedback.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form field value
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear individual error as the user types to improve usability
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }

    // Clear top form alert if any
    if (formAlert) {
      setFormAlert('');
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FORM VALIDATION LOGIC
  // ---------------------------------------------------------------------------

  /**
   * Validates all registration fields against assignment rules.
   * Returns an object containing error messages for any invalid fields.
   */
  const validateForm = () => {
    const newErrors = {};

    // 1. Full Name Validation: Must not be empty and at least 2 characters
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }

    // 2. Email Validation: Must not be empty and must match standard email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. user@example.com).';
    }

    // 3. Password Validation: Must not be empty and must be >= 6 characters
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    // 4. Confirm Password Validation: Must not be empty and must match Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  // ---------------------------------------------------------------------------
  // 4. FORM SUBMIT HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handles form submission:
   * - Prevents default page refresh (`e.preventDefault()`).
   * - Performs validation.
   * - If valid, simulates an API registration request with loading state and delay.
   * - Displays a success notification and navigates to `/login`.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Reset feedback alerts
    setFormAlert('');
    setSuccessMessage('');

    // Run client-side validation
    const validationErrors = validateForm();

    // If there are errors, update state and halt submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormAlert('Please fix the errors highlighted below.');
      return;
    }

    // If validation passed, start simulated registration request
    setIsSubmitting(true);

    // Simulate backend network latency (1.5 seconds)
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage('Registration successful! Redirecting to login page...');

      // Redirect user to the Login page after brief delay for visual feedback
      setTimeout(() => {
        navigate('/login', {
          // Optionally pass registered email in route state to prefill login field
          state: { registeredEmail: formData.email },
        });
      }, 1500);
    }, 1200);
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
