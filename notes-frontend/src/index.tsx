import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';

// Suppress ReactQuill findDOMNode deprecation warning
const originalWarn = console.warn;
const originalError = console.error;

// Override console methods to filter out findDOMNode warnings
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('findDOMNode is deprecated')) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('findDOMNode is deprecated')) {
    return;
  }
  originalError.apply(console, args);
};

// Also suppress React's internal warning system
if (typeof window !== 'undefined') {
  const originalConsoleWarn = window.console.warn;
  window.console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('findDOMNode is deprecated')) {
      return;
    }
    originalConsoleWarn.apply(window.console, args);
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
