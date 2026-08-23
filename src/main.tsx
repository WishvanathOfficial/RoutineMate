import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@app/store';
import { router } from '@app/router';
import ThemeSync from '@app/ThemeSync';
import AuthSessionBridge from '@app/AuthSessionBridge';
import '@styles/global.scss';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element (#root) was not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeSync />
      <AuthSessionBridge />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
