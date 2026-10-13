import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css';
import App from './App.jsx';

/**
 * Main Application Entry Point
 * -----------------------------------------------------------------------------
 * Redux Provider Setup:
 * - `<Provider store={store}>` acts as a context provider from `react-redux`.
 * - By wrapping the top-level `<App />` component in `<Provider>`, the configured
 *   Redux store becomes accessible to all nested components across the component tree.
 * - Components can consume state using `useSelector()` and dispatch state updates
 *   using `useDispatch()`.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
