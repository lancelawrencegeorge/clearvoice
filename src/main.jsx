import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register the self-destructing service worker. It replaces the old SW,
// clears all caches, unregisters itself, and forces a reload — so no stale
// cached code (like the old floating CustomerFilter) can survive in the PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)