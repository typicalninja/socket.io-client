import React from 'react';
//import ReactDOM from 'react-dom';
import App from './App';
// @ts-ignore
import { createRoot } from 'react-dom/client';

// for mui
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

