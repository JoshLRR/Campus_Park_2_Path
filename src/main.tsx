import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
// @ts-expect-error directive is necessary to avoid import error from App.tsx
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
