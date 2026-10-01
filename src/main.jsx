import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'

// Chrome avisa que se puede instalar la app apenas carga la página; se guarda
// para que el botón de Mi cuenta lo use aunque esa página cargue después.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__instalarApp = e
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)