import { createContext, useContext, useState } from 'react';

const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);

  const toggle = () => setIsVisible((v) => !v);
  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  return (
    <PomodoroContext.Provider value={{ isVisible, toggle, show, hide }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export const usePomodoro = () => {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within PomodoroProvider');
  return ctx;
};
