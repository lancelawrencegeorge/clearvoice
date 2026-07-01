import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register a self-destructing service worker under a NEW filename.
// The old SW had '/sw.js' cached and intercepted the fetch, serving its own
// stale version — so the new SW never installed. Using '/sw-killer.js' forces
// the browser to fetch this file from the network (old SW doesn't have it cached).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-killer.js', { updateViaCache: 'none' })
      .then((reg) => reg.update())
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)