import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './site/App';
import './site/site.css';
import './site/theme.css';
import { initializeAnalytics } from './firebase';
import AuthProvider from './site/AuthProvider';
import VisitorProvider from './site/VisitorProvider';
import ThemeProvider from './site/ThemeProvider';
import LanguageProvider from './i18n/LanguageProvider';

// Keep local development and design comparisons out of production Analytics.
if (import.meta.env.PROD) void initializeAnalytics();

createRoot(document.getElementById('root')).render(<React.StrictMode><LanguageProvider><ThemeProvider><AuthProvider><VisitorProvider><App /></VisitorProvider></AuthProvider></ThemeProvider></LanguageProvider></React.StrictMode>);
