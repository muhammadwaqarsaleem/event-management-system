import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout Components
import Navbar from './components/Navbar';

// Import Page Components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetails from './pages/EventDetails';

// Import Styles
import './App.css';

/**
 * App Component - Root Application Entry with React Router v6
 * 
 * Routing Setup Explained:
 * -----------------------------------------------------------------------------
 * 1. <BrowserRouter>:
 *    - Wraps the entire application to enable HTML5 History API routing (clean URLs
 *      without `#` hash fragments).
 *    - Keeps the UI in sync with the current URL path.
 * 
 * 2. <Navbar>:
 *    - Placed inside <BrowserRouter> but outside <Routes> so that it persists
 *      across every page transition.
 * 
 * 3. <Routes>:
 *    - Replaces the older v5 <Switch>.
 *    - Looks through all children <Route> elements and renders the best-matching
 *      route based on relative path ranking.
 * 
 * 4. <Route path="..." element={<Component />} />:
 *    - Maps a specific path to a React component passed through the `element` prop.
 *    - `/` -> Renders Home landing page with live events listing, category filter & pagination
 *    - `/events/:id` -> Renders dedicated EventDetails page for the selected event ID
 *    - `/login` -> Renders Login page
 *    - `/register` -> Renders Registration page
 *    - `*` -> Wildcard catch-all route for unmatched paths (redirects to home)
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Persistent Top Navigation Bar */}
        <Navbar />

        {/* Main Content Area where different route pages are mounted */}
        <main className="main-content">
          <Routes>
            {/* Route 1: Home Landing Page & Events Listing */}
            <Route path="/" element={<Home />} />

            {/* Route 2: Dedicated Event Details Page (Step 5) */}
            <Route path="/events/:id" element={<EventDetails />} />

            {/* Route 3: Login Page */}
            <Route path="/login" element={<Login />} />

            {/* Route 4: Register Page */}
            <Route path="/register" element={<Register />} />

            {/* Fallback / 404 Catch-All Route: Redirect unknown routes back to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="app-footer">
          <p>© {new Date().getFullYear()} EventVerse. Event Management System — Web Development Assignment 2.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
