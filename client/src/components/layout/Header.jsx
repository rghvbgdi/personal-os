import { Menu, Bell } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import Button from '@/components/ui/Button.jsx';

export default function Header({ title, subtitle, actions }) {
  const { toggle } = useSidebar();
  const { user } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          {title && <h1 className="text-sm font-semibold text-text-primary leading-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
}
