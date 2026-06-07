import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggle = () => setIsOpen((v) => !v);
  const close = () => setIsOpen(false);
  const toggleCollapse = () => setIsCollapsed((v) => !v);

  return (
    <SidebarContext.Provider value={{ isOpen, isCollapsed, toggle, close, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};
