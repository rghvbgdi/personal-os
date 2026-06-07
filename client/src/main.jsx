import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { SidebarProvider } from './context/SidebarContext.jsx';
import { CommandPaletteProvider } from './context/CommandPaletteContext.jsx';
import { PomodoroProvider } from './context/PomodoroContext.jsx';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CommandPaletteProvider>
            <PomodoroProvider>
              <SidebarProvider>
                <App />
                <Toaster
                  position="top-center"
                  toastOptions={{
                    style: {
                      background: '#171717',
                      color: '#fafafa',
                      border: '1px solid #262626',
                      borderRadius: '10px',
                      fontSize: '13px',
                    },
                    success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                  }}
                />
              </SidebarProvider>
            </PomodoroProvider>
          </CommandPaletteProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
