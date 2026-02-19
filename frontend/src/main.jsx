/**
 * MAIN.JSX - Entry point of React app
 * 
 * This file:
 * 1. Imports React
 * 2. Imports our main App component
 * 3. Renders App into the HTML page (in the #root div)
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Render the App component into the HTML element with id="root"
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
