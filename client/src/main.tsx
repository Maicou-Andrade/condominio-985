import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { trpc, trpcClient } from './trpc';
import { AuthProvider } from './auth';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const GOOGLE_CLIENT_ID = (window as any).__GOOGLE_CLIENT_ID__ || 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '579319222313-4ctfqe9slsvf0uikoo262c9onl9sfkgp.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
