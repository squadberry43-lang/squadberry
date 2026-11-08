import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import App from './App';
import { ConsentProvider } from './context/ConsentContext';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <AuthProvider>
          <LocaleProvider>
            <App />
          </LocaleProvider>
        </AuthProvider>
      </ConsentProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
