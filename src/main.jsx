import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Force the browser to check for SW updates WITHOUT using the HTTP cache.
// The old SW registration didn't set updateViaCache:'none', so the browser
// may be using a 24-hour-cached copy of /sw.js and never seeing our new
// self-destructing version. This re-registers with the flag and calls update().
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Force an immediate update check
        return reg.update();
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)