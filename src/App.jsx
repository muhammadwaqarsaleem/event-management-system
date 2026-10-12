import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layout Components
import Navbar from './components/Navbar';

// Import Page Components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

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
 *    - `/` -> Renders Home landing page
 *    - `/login` -> Renders Login page
 *    - `/register` -> Renders Registration page
 *    - `*` -> Wildcard catch-all route for unmatched paths (redirects to home or shows 404)
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
            {/* Route 1: Home Landing Page */}
            <Route path="/" element={<Home />} />

            {/* Route 2: Login Page */}
            <Route path="/login" element={<Login />} />

            {/* Route 3: Register Page */}
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
