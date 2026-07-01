import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register the self-destructing service worker. It will replace any old
// service worker, clear all caches, unregister itself, and force-reload
// the page — so no stale cached code (like the old floating CustomerFilter)
// can survive.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}