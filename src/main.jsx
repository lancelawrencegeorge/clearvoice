import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Register the self-destructing service worker at /sw.js.
// The browser checks for updates to this file on every navigation (bypassing
// the old SW's fetch handler). When it finds new content, it installs this
// SW, which clears all caches, notifies clients to reload, then unregisters.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => reg.update())
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)