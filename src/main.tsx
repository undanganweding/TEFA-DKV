// Ensure window.fetch is safely assignable in sandboxed iframe environments
(function () {
  try {
    const originalFetch = window.fetch;
    let fetchVal = originalFetch;
    Object.defineProperty(window, 'fetch', {
      get: function () {
        return fetchVal || originalFetch;
      },
      set: function (val) {
        fetchVal = val;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Ignore
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
