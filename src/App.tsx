import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarAI from './pages/CalendarAI';
import Habits from './pages/Habits';
import Settings from './pages/Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const deviceId = localStorage.getItem('timezy_device_id');
    setIsAuthenticated(!!deviceId);

    const handleOnline = () => {
      toast.success('Back online', { description: 'Syncing your data in the background.' });
    };

    const handleOffline = () => {
      toast.error('Offline Mode', { description: 'You are viewing cached data. Changes will sync later.', duration: 5000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isAuthenticated === null) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-center" expand={false} richColors />
      <Router>
        <Routes>
          <Route 
            path="/auth" 
            element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Layout /> : <Navigate to="/auth" />}
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="calendar" element={<CalendarAI />} />
            <Route path="habits" element={<Habits />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

