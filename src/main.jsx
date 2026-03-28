// FORCE CACHE RESET FOR MOBILE
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
caches.keys().then((names) => {
  for (let name of names) caches.delete(name);
});

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './App.css'

// Trusted Types Policy for high-security environments (Edge/Chrome)
try {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string,
      createScript: (string) => string,
      createScriptURL: (string) => string,
    });
  }
} catch (e) {
  console.warn('TrustedTypes policy creation failed, continuing with standard security.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Tactical Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
