// src/main.tsx
console.log("--- APP STARTING DEBUG ---"); // Add this line
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Your global CSS file
import { BrowserRouter } from 'react-router-dom';
import { AuthContextProvider } from './contexts/AuthContext';

// --- Place the console.log here, OUTSIDE of the render method's arguments ---
console.log('DEBUG: main.tsx file is running and rendering React App.');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
);