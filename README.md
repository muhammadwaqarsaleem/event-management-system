# 📅 EventVerse — Event Management & Discovery System

> **FAST-NUCES CS Semester 7 — Web Programming (Assignment 2)**  
> A production-grade, responsive single-page web application (SPA) built with React, Redux Toolkit, React Router, and the Ticketmaster Discovery API.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://eventverse-assignment2.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?style=for-the-badge&logo=redux)](https://redux-toolkit.js.org/)

---

## 🌐 Live Deployment

- **Live URL**: [https://eventverse-assignment2.vercel.app](https://eventverse-assignment2.vercel.app) *(Replace with your deployed Vercel URL)*
- **Repository**: [https://github.com/muhammadwaqarsaleem/event-management-system](https://github.com/muhammadwaqarsaleem/event-management-system)

---

## 📖 Project Overview

**EventVerse** is an interactive, modern Event Management and Discovery web application designed to connect users with live entertainment, concerts, sporting matches, theatre performances, and cultural happenings worldwide. 

The application integrates directly with the **Ticketmaster Discovery API v2** for live listings, provides client-side authentication with local storage session persistence, features a protected personal registration dashboard, and boasts a responsive mobile-first UI with rich micro-animations.

---

## ✨ Features Implemented

### 1. 🔐 Client-Side Authentication Simulation
- **User Registration**: Create an account with full name, email, and password validation. Accounts persist across browser sessions in `localStorage`.
- **User Login**: Validates credentials against registered users with real-time feedback and error alerts. Includes a password visibility toggle.
- **Session Management**: Automatically restores logged-in session on page reloads via Redux `authSlice`.
- **Safe Logout**: Clears authentication state in Redux and `localStorage`, redirecting to `/login`.

### 2. 🎟️ Live Ticketmaster Discovery & Event Feed
- **Live Data Ingestion**: Fetches events directly from the Ticketmaster Discovery API v2.
- **Dual-Field Search**: Search events simultaneously by keyword (title, artist, venue) and city / metro location.
- **Category Filter Pills**: Filter instantly by classification (All, Music, Sports, Arts & Theatre, Film, Miscellaneous) with horizontal touch scrolling on mobile.
- **Sorting Options**: Sort results dynamically by Date (`date,asc` / `date,desc`), Name (`name,asc` / `name,desc`), or Ticketmaster Relevance.
- **Pagination**: Navigate between pages with server-side pagination, page bounds protection, and total event count badges.
- **Rate-Limit Resilience**: Graceful error banners and debounce protection against Ticketmaster rate limits (5 req/sec).

### 3. 🔍 Event Details Page
- **Dedicated Route**: Dynamic routing via `/events/:id`.
- **Rich Metadata Display**: Venue name, complete street address, date, time, timezone, ticket price range, ticket status (On Sale, Rescheduled, Postponed, Cancelled), and official promoter notes.
- **Consistent Visuals**: Centralized deterministic 16:9 image resolution helper guarantees identical image display between grid cards and details banners.
- **Official Ticketmaster Link**: Direct external link to official ticketing page.
- **Responsive Layout**: Balanced two-column layout on desktop (media on left, details and registration on right) and single-column layout on mobile.

### 4. 🛡️ Protected Routes & State Persistence
- **Route Guarding (`ProtectedRoute`)**: Restricts access to `/my-events`. Unauthenticated visitors are redirected to `/login`, preserving their target route in `location.state.from` for automatic post-login redirection.
- **Registration Management (`registrationsSlice`)**:
  - One-click event registration from event details page.
  - Duplicate registration prevention with clear user messaging.
  - Active upcoming registration counter badge on navbar.
  - Event registration cancellation with inline confirmation dialog.
  - Categorization into **Upcoming Events** and **Past Events** based on local date benchmarks.
  - Full state persistence in `localStorage`.

### 5. 📱 Fully Responsive Mobile-First Design
- **Responsive Navbar**:
  - Desktop: Clean row layout with brand logo, navigation links, personalized greeting ("Hi, [Name]"), and logout button.
  - Mobile (< 768px): Animated hamburger menu toggle with smooth slide-down navigation drawer and backdrop blur overlay.
  - Automatically closes on route navigation, link click, outside backdrop click, or when pressing `Escape`.
- **Mobile Search Bar**: Stacks keyword, city input, and submit buttons into a column on mobile while maintaining row alignment on tablet and desktop.
- **Horizontal Category Pills**: Smooth horizontal scrolling (`overflow-x: auto; -webkit-overflow-scrolling: touch;`) on small devices without breaking viewport width.
- **CSS Grid Events Feed**: Responsive CSS grid (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`) ensuring uniform card heights and clean padding across viewports.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | **React 19** | Component-based UI with Hooks (`useState`, `useEffect`, `useMemo`, `useRef`) |
| **Build Tool & Bundler** | **Vite 8** | Ultra-fast HMR and optimized production bundling |
| **State Management** | **Redux Toolkit & React-Redux** | Centralized slices: `authSlice`, `eventsSlice`, `registrationsSlice` |
| **Client Routing** | **React Router v7 (v6 compatibility)** | `<BrowserRouter>`, `<Routes>`, `<Route>`, `<NavLink>`, `<Navigate>` |
| **Styling** | **Pure Vanilla CSS** | Custom Design System with CSS variables, modern gradients, glassmorphism, flexbox & CSS grid |
| **API Integration** | **Ticketmaster Discovery API v2** | Real-time live event discovery and venue data |
| **Deployment Target** | **Vercel** | Single-page application hosting with `vercel.json` rewrite routing |

---

## 📁 Project Directory Structure

```text
event-management-system/
├── public/                    # Static public assets
├── src/
│   ├── assets/                # Images and SVGs
│   ├── components/            # Reusable UI components
│   │   ├── EventCard.jsx      # Event listing card with 16:9 media & badges
│   │   ├── Navbar.jsx         # Responsive navbar with mobile hamburger menu
│   │   ├── ProtectedRoute.jsx # Route authentication guard
│   │   └── SearchBar.jsx      # Dual-input keyword & city search bar
│   ├── pages/                 # Route page components
│   │   ├── EventDetails.jsx   # Detailed event view with registration actions
│   │   ├── Home.jsx           # Hero banner, category pills & events feed
│   │   ├── Login.jsx          # User login form with validation
│   │   ├── MyEvents.jsx       # Registered events dashboard (Upcoming / Past)
│   │   └── Register.jsx       # User registration form
│   ├── redux/                 # Redux Toolkit store & state slices
│   │   ├── authSlice.js       # Authentication state & localStorage sync
│   │   ├── eventsSlice.js     # Ticketmaster API event fetch & pagination
│   │   ├── registrationsSlice.js # Event registrations & cancellation
│   │   └── store.js           # Central Redux store configuration
│   ├── services/              # External API services
│   │   └── ticketmasterApi.js # Ticketmaster Discovery API caller & normalizer
│   ├── utils/                 # Utility helpers
│   │   └── imageHelper.js     # Deterministic 16:9 image selector & fallback
│   ├── App.css                # Global components & responsive design system
│   ├── App.jsx                # App root & route definitions
│   ├── index.css              # Reset, typography & CSS variables
│   └── main.jsx               # Application entry point with Redux Provider
├── .env.example               # Template for environment variables
├── index.html                 # HTML shell
├── package.json               # Project dependencies and npm scripts
├── vercel.json                # Vercel SPA rewrite routing configuration
├── vite.config.js             # Vite configuration
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally on your machine.

### Prerequisites

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**: Installed and configured on your system

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/muhammadwaqarsaleem/event-management-system.git
   cd event-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   - Copy `.env.example` to a new `.env` file in the root directory:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and add your Ticketmaster Discovery API key:
     ```env
     VITE_TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
     ```
     > **Tip**: If you do not have an API key, register for a free account at [Ticketmaster Developer Portal](https://developer.ticketmaster.com/) to obtain one instantly.

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles and minifies the application into the `dist/` folder for production. |
| `npm run preview` | Serves the production build locally to test performance and routing. |
| `npm run lint` | Runs ESLint to verify code quality and coding standards. |

---

## 🚢 Production Deployment to Vercel

The project is pre-configured for seamless single-click deployment to [Vercel](https://vercel.com):

1. **SPA Routing Configuration (`vercel.json`)**:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   This rewrite configuration ensures that direct navigation or browser reloads on client-side routes (e.g. `/my-events`, `/events/:id`, `/login`) correctly serve `index.html` without returning 404 errors.

2. **Deploy via Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Deploy via Vercel Web Dashboard**:
   - Push your changes to GitHub.
   - Import the repository into your Vercel Dashboard.
   - In **Project Settings** > **Environment Variables**, set:
     - `VITE_TICKETMASTER_API_KEY` = *your Ticketmaster API Key*
   - Click **Deploy**.

---

## 👥 Authors & Academic Information

- **Student Name**: Muhammad Waqar Saleem
- **Course**: CS Web Programming (Section 7A)
- **Institution**: FAST National University of Computer & Emerging Sciences (NUCES)
- **Assignment**: Assignment 2 — Event Management System

---

## 📄 License

This project was developed for educational purposes as part of the CS Web Programming curriculum at FAST-NUCES.
