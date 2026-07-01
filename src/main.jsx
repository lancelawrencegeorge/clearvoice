import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// No service worker registration.
// The old SW at /sw.js will be updated by the browser's automatic update
// check (which bypasses the old SW). The new /sw.js is self-destructing:
// it clears all caches, reloads clients, then unregisters itself.
// We do NOT re-register here to avoid an infinite register→destroy→reload loop.

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)