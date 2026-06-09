import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import TodayTab from './TodayTab.jsx';
import TasksTab from './TasksTab.jsx';
import CalendarTab from './CalendarTab.jsx';
import SleepTab from './SleepTab.jsx';

export default function TodoModule() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<Navigate to="/todo/today" replace />} />
        <Route path="/today"     element={<TodayTab />} />
        <Route path="/tasks"     element={<TasksTab />} />
        <Route path="/calendar"  element={<CalendarTab />} />
        <Route path="/sleep"     element={<SleepTab />} />
      </Routes>
    </AnimatePresence>
  );
}
