import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthMarketingApp from './AuthMarketingApp.jsx';
import './mobileHeroPatch.js';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthMarketingApp />
  </React.StrictMode>
);
