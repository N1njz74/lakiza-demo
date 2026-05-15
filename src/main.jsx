import React from 'react';
import { createRoot } from 'react-dom/client';
import InteractiveApp from './InteractiveApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InteractiveApp />
  </React.StrictMode>
);
