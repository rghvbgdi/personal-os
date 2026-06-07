import { Menu, Zap } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext.jsx';

export default function Header({ title, subtitle, actions }) {
  const { toggle } = useSidebar();

  return (
    <header
      className="sticky top-0 z-30 flex flex-col bg-background/90 backdrop-blur-xl border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — desktop only, for sidebar toggle */}
          <button
            onClick={toggle}
            className="hidden lg:flex p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile branding logo — only shown on mobile since sidebar is hidden */}
          <div className="flex lg:hidden h-7 w-7 rounded-xl bg-accent items-center justify-center flex-shrink-0 shadow-glow-sm">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="min-w-0">
            {title && (
              <h1 className="text-base font-bold text-text-primary leading-tight truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-text-muted leading-none mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side — action buttons */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
