import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, History, PlusCircle, Settings as SettingsIcon, BarChart2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { useStore } from './store';
import { AnimatePresence, motion } from 'motion/react';
import Dashboard from './screens/Dashboard';
import NewMatch from './screens/NewMatch';
import Scorer from './screens/Scorer';
import MatchHistory from './screens/MatchHistory';
import Settings from './screens/Settings';
import Statistics from './screens/Statistics';
import MatchDetails from './screens/MatchDetails';

function BottomNav() {
  const location = useLocation();
  const isScorer = location.pathname.startsWith('/scorer');
  
  if (isScorer) return null; // Don't show bottom nav on live scoring screen to maximize space

  return (
    <div className="fixed bottom-0 w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 px-6 py-4 pb-safe flex justify-around items-center z-50 transition-colors duration-300">
      <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`}>
        <Home size={24} />
        <span className="text-[10px] font-black tracking-widest uppercase">Overview</span>
      </Link>
      <Link to="/new" className={`flex flex-col items-center gap-1 ${location.pathname === '/new' ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`}>
        <PlusCircle size={28} className={location.pathname === '/new' ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-300 dark:text-zinc-600'} />
        <span className="text-[10px] font-black tracking-widest uppercase">Match</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${location.pathname === '/history' ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`}>
        <History size={24} />
        <span className="text-[10px] font-black tracking-widest uppercase">History</span>
      </Link>
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode, key?: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <div className="relative flex-1">
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<PageWrapper key="dash"><Dashboard /></PageWrapper>} />
          <Route path="/new" element={<PageWrapper key="new"><NewMatch /></PageWrapper>} />
          <Route path="/scorer" element={<PageWrapper key="score"><Scorer /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper key="history"><MatchHistory /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper key="settings"><Settings /></PageWrapper>} />
          <Route path="/statistics" element={<PageWrapper key="stats"><Statistics /></PageWrapper>} />
          <Route path="/match/:id" element={<PageWrapper key="detail"><MatchDetails /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const theme = useStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    };

    applyTheme();
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col font-sans text-gray-900 dark:text-white selection:bg-blue-100 selection:text-blue-900 pb-24 transition-colors duration-300">
        <main className="flex-1 max-w-lg mx-auto w-full bg-white dark:bg-zinc-900 min-h-screen shadow-xl relative border-x border-gray-200 dark:border-zinc-800 transition-colors duration-300 overflow-hidden flex flex-col">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}
