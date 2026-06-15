import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Repeat, 
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { to: '/habits', icon: Repeat, label: 'Habits' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-app-bg)] flex flex-col overflow-hidden font-sans text-text-main pb-[130px] md:pb-0">
      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full max-w-md mx-auto relative">
        <div className="flex-1 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div 
        className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <nav className="bg-white/90 backdrop-blur-xl border border-[#E8EEE5] shadow-[0_8px_30px_rgb(0,0,0,0.08)] h-[64px] w-full max-w-[380px] rounded-[32px] px-2 flex items-center justify-between pointer-events-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "relative flex items-center justify-center flex-shrink-0 h-[48px] rounded-[24px] transition-all duration-300 ease-out cursor-pointer",
                isActive ? "px-4 text-[var(--color-primary)]" : "w-[48px] hover:bg-[#F6F8F4] text-[#A0A0A0]"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#DCE8D7] rounded-[24px]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon 
                    className={cn(
                      "w-[22px] h-[22px] flex-shrink-0 transition-colors duration-300 relative z-10",
                      isActive ? "text-[var(--color-primary)] scale-105" : "text-[#A0A0A0]"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  <div 
                    className={cn(
                      "flex items-center transition-all duration-300 ease-out overflow-hidden whitespace-nowrap relative z-10",
                      isActive ? "max-w-[100px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
                    )}
                  >
                    <span className="text-[13px] font-extrabold text-[var(--color-primary)]">
                      {item.label}
                    </span>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
