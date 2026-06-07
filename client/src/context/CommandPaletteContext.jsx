import { createContext, useContext, useState, useEffect } from 'react';

const CommandPaletteContext = createContext(null);

export function CommandPaletteProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export const useCommandPalette = () => {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
};
