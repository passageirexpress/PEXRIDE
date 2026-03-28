import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safety check for fetch to prevent "Cannot set property fetch of #<Window> which has only a getter" error
// This can happen in some environments where fetch is read-only.
// We use a more passive approach to avoid interfering with the platform's proxy.
if (typeof window !== 'undefined' && !window.fetch) {
  console.warn('Fetch API is missing or blocked. This may cause issues in some browsers.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
