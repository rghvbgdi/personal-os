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

// ─── iOS PWA Viewport Height Fix ────────────────────────────────────────────
// window.innerHeight is the ONLY reliable source of true viewport height on
// iOS Safari / PWA home screen. CSS units (100vh, 100dvh, 100svh) can all
// miscalculate on iOS, especially with the Dynamic Island and home indicator.
// We measure once on load and set it as a CSS variable used by #root.
function setAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${window.innerHeight}px`
  );
}

// Set immediately on script load
setAppHeight();

// Also re-set after a short delay in case iOS hasn't fully initialized the viewport
setTimeout(setAppHeight, 100);
setTimeout(setAppHeight, 500);

// Update on orientation change (e.g. rotating device, though app is portrait-locked)
window.addEventListener('orientationchange', () => {
  setTimeout(setAppHeight, 300);
});

// ─────────────────────────────────────────────────────────────────────────────

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
