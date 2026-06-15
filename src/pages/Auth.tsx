import React, { useState } from 'react';
import { Sun, Check, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type OnboardStep = 'welcome' | 'notifications' | 'success';

export default function Auth() {
  const [step, setStep] = useState<OnboardStep>('welcome');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleWelcomeNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const deviceId = crypto.randomUUID();
    localStorage.setItem('timezy_device_id', deviceId);
    localStorage.setItem('timezy_user_name', name.trim());

    // Best-effort attempt to store in Supabase
    try {
      if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
         await supabase.from('users').insert([{ id: deviceId, full_name: name.trim() }]);
      }
    } catch (e) {
      // Ignore if it fails due to RLS or missing table
    }

    setStep('notifications');
  };

  const handleNotificationsNext = () => {
    // In a real PWA or native app, request notification permission here
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    setStep('success');
  };

  const handleFinish = () => {
    // Reload to hit the App.tsx check and seamlessly route to Dashboard
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 bg-[#F6F8F4] flex flex-col justify-center px-6 overflow-hidden">
      <AnimatePresence mode="wait">
        
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm mx-auto flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-white rounded-[20px] shadow-sm flex items-center justify-center text-[var(--color-primary)] mb-6 border border-[#E8EEE5]">
              <Sun className="w-8 h-8" />
            </div>
            
            <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] mb-2 tracking-tight text-center">Welcome to Timezy</h1>
            <p className="text-[15px] font-medium text-[#8BA090] mb-8 text-center px-4">Let's personalize your experience.</p>

            <form onSubmit={handleWelcomeNext} className="w-full bg-white p-6 rounded-[24px] shadow-sm border border-[#E8EEE5]">
              <label className="block text-[14px] font-bold text-[var(--color-primary)] mb-3 px-1">What should we call you?</label>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[52px] px-4 bg-[#F6F8F4] border border-[#E8EEE5] rounded-[16px] outline-none focus:border-[#8BA090] text-[15px] font-medium text-[var(--color-primary)] placeholder-[#8BA090] transition-colors mb-6"
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!name.trim()}
                type="submit"
                className="w-full h-[54px] bg-[var(--color-primary)] text-white font-bold rounded-[16px] flex items-center justify-center disabled:opacity-50 transition-all"
              >
                Continue
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm mx-auto flex flex-col items-center"
          >
            <div className="w-full bg-white p-8 rounded-[32px] shadow-sm border border-[#E8EEE5] flex flex-col items-center">
              <div className="w-20 h-20 bg-[#E5F5F7] rounded-full flex items-center justify-center text-[#4A868C] mb-6">
                <Bell className="w-10 h-10" />
              </div>
              
              <h2 className="text-[24px] font-extrabold text-[var(--color-primary)] mb-3 text-center">Stay on track</h2>
              <p className="text-[14px] text-[#8BA090] mb-8 font-medium leading-relaxed text-center">
                Enable reminders so you never miss important tasks.
              </p>

              <div className="w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNotificationsNext}
                  className="w-full h-[54px] bg-[var(--color-primary)] text-white font-bold rounded-[16px] flex items-center justify-center transition-all"
                >
                  Allow Notifications
                </motion.button>
                <button
                  onClick={() => setStep('success')}
                  className="w-full h-[54px] bg-transparent text-[14px] font-bold text-[#8BA090] hover:text-[var(--color-primary)] rounded-[16px] flex items-center justify-center transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            className="w-full max-w-sm mx-auto flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-lg relative"
            >
              {/* Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[var(--color-success)] rounded-full"
                  initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0], 
                    opacity: [1, 1, 0],
                    x: Math.cos(i * 60 * Math.PI / 180) * 80,
                    y: Math.sin(i * 60 * Math.PI / 180) * 80,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              ))}

              <motion.svg 
                className="w-12 h-12 text-white"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </motion.svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8 w-full"
            >
              <h2 className="text-[28px] font-extrabold text-[var(--color-primary)] mb-2">You're all set</h2>
              <p className="text-[15px] text-[#8BA090] font-medium mb-10">Let's get productive.</p>
              
              <div className="bg-white p-2 rounded-[24px] shadow-sm border border-[#E8EEE5]">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleFinish}
                  className="w-full h-[54px] bg-[var(--color-primary)] text-white font-bold rounded-[16px] flex items-center justify-center transition-all"
                >
                  Get Started
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

