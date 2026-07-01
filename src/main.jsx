import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Also clear all caches
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        // Unregister all, then force a hard reload to bypass any cached assets
        Promise.all(registrations.map((reg) => reg.unregister())).then(() => {
          window.location.reload();
        });
      }
    }).catch(() => {});
  });
}