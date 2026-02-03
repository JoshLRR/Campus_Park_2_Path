/**
 * Application entry point.
 *
 * This file is responsible for bootstrapping the React application and
 * attaching it to the DOM. It creates the root React rendering context
 * and renders the top-level {@link App} component.
 *
 * The application is wrapped in {@link React.StrictMode} to enable
 * additional runtime checks and warnings during development.
 * Strict Mode helps surface potential issues such as unsafe lifecycles,
 * legacy API usage, and unintended side effects.
 *
 * Global styles are imported here to ensure they are applied consistently
 * across the entire application.
 *
 * @remarks
 * This file should remain minimal and free of application logic.
 * All routing, state management, and feature composition should be
 * handled within the {@link App} component or its children.
 *
 * @packageDocumentation
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
