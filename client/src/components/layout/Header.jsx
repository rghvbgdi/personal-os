import { Menu, Zap, ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

// Routes that are "root" pages — no back button shown
const ROOT_PATHS = ['/dashboard', '/expenses', '/analytics', '/budget', '/goals', '/placement', '/notes', '/habits', '/', '/login', '/register'];

export default function Header({ title, subtitle, actions }) {
  const { toggle } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const showBack = !ROOT_PATHS.includes(location.pathname);

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
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Hamburger — desktop only */}
          <button
            onClick={toggle}
            className="hidden lg:flex p-2 rounded-lg text-[#555] hover:text-[#ccc] hover:bg-[#1a1a1a] transition-colors touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile: back button or logo */}
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-[#1a1a1a] text-[#888] hover:text-white transition-colors touch-manipulation flex-shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex lg:hidden h-7 w-7 rounded-xl bg-[#059669] items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(5,150,105,0.25)]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
          )}

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
