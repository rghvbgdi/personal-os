import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import PomodoroTimer from './components/PomodoroTimer.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Expenses from './pages/Expenses.jsx';
import Analytics from './pages/Analytics.jsx';
import Budget from './pages/Budget.jsx';
import Goals from './pages/Goals.jsx';
import Placement from './pages/Placement.jsx';
import Notes from './pages/Notes.jsx';
import Habits from './pages/Habits.jsx';
import NotFound from './pages/NotFound.jsx';
// ── Todo Module ──
import TodoModule from './pages/todo/TodoModule.jsx';
import { ROUTES } from './constants/index.js';

export default function App() {
  // Global fix for iOS Safari Keyboard Bug
  // When an input loses focus (keyboard dismisses), iOS often leaves a black void.
  // This forces the viewport to perfectly reset to 0,0.
  useEffect(() => {
    const handleFocusOut = () => {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 10);
    };
    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, []);

  return (
    <>
      {/* Global overlays */}
      <CommandPalette />
      <PomodoroTimer />

      <AnimatePresence mode="wait">
        <Routes>
          <Route path={ROUTES.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path={ROUTES.EXPENSES} element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path={ROUTES.ANALYTICS} element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path={ROUTES.BUDGET} element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path={ROUTES.GOALS} element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path={ROUTES.PLACEMENT} element={<ProtectedRoute><Placement /></ProtectedRoute>} />
          <Route path={ROUTES.NOTES} element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path={ROUTES.HABITS} element={<ProtectedRoute><Habits /></ProtectedRoute>} />
          {/* Todo module — handles /todo/* sub-routes internally */}
          <Route path="/todo/*" element={<ProtectedRoute><TodoModule /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
