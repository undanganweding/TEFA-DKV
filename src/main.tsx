import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import AppWithDatabase from './AppWithDatabase';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithDatabase />
  </StrictMode>,
);
