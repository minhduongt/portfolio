import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './site/App';
import './site/site.css';
import { initializeAnalytics } from './firebase';
import AuthProvider from './site/AuthProvider';
import VisitorProvider from './site/VisitorProvider';

// Keep local development and design comparisons out of production Analytics.
if (import.meta.env.PROD) void initializeAnalytics();

createRoot(document.getElementById('root')).render(<React.StrictMode><AuthProvider><VisitorProvider><App /></VisitorProvider></AuthProvider></React.StrictMode>);
