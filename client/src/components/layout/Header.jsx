import { Menu, Zap } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext.jsx';

export default function Header({ title, subtitle, actions }) {
  const { toggle } = useSidebar();

  return (
    <header
      className="flex-shrink-0 z-30 flex flex-col"
      style={{
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1a1a1a',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="h-14 flex items-center justify-between px-4">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger — desktop only */}
          <button
            onClick={toggle}
            className="hidden lg:flex p-2 rounded-lg text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a] transition-colors touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile branding — compact logo */}
          <div className="flex lg:hidden h-7 w-7 rounded-xl bg-[#059669] items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(5,150,105,0.25)]">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-[15px] font-bold text-[#f0f0f0] leading-tight truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[10px] text-[#444] leading-none mt-0.5 truncate font-medium">
                {subtitle}
              </p>
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
