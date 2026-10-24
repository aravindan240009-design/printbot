import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@xerox/ui';
import '@xerox/ui/src/studio.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider><App /></ThemeProvider>
  </React.StrictMode>
);

