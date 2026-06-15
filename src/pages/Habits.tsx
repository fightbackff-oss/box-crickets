import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, Trophy, Plus, Check, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function Habits() {
  const [habits, setHabits] = useState<any[]>([]);
  const [newHabit, setNewHabit] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  async function fetchHabits() {
    try {
      const deviceId = localStorage.getItem('timezy_device_id');
      if (!deviceId) return;

      const cached = localStorage.getItem('timezy_habits_cache');
      if (cached) setHabits(JSON.parse(cached));
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
         setIsLoading(false);
         return;
      }

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', deviceId);

      if (error) throw error;
      if (data) {
        setHabits(data);
        localStorage.setItem('timezy_habits_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      if (!navigator.onLine) {
         toast.info('Loaded habits from offline cache');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabit.trim()) return;

    try {
      const deviceId = localStorage.getItem('timezy_device_id');
      if (!deviceId) return;

      const habit = {
        name: newHabit,
        user_id: deviceId,
        current_streak: 0,
        best_streak: 0
      };

      const { data, error } = await supabase.from('habits').insert([habit]).select();
      if (error) throw error;
      if (data) {
        const updated = [...habits, data[0]];
        setHabits(updated);
        localStorage.setItem('timezy_habits_cache', JSON.stringify(updated));
        toast.success('Habit Created');
      }
      setNewHabit('');
    } catch (err) {
      const fakeHabit = { id: Math.random().toString(), name: newHabit, current_streak: 0, best_streak: 0 };
      const updated = [...habits, fakeHabit];
      setHabits(updated);
      localStorage.setItem('timezy_habits_cache', JSON.stringify(updated));
      toast.success('Habit Created Locally');
      setNewHabit('');
    }
  }

  async function completeHabit(id: string) {
    const updated = habits.map(h => {
      if (h.id === id) {
        return { ...h, current_streak: h.current_streak + 1, best_streak: Math.max(h.best_streak, h.current_streak + 1) };
      }
      return h;
    });
    setHabits(updated);
    localStorage.setItem('timezy_habits_cache', JSON.stringify(updated));
    toast.success('Awesome! Streak updated.');
    
    try {
      const habit = updated.find(h => h.id === id);
      if (habit) {
        await supabase.from('habits').update({ 
          current_streak: habit.current_streak,
          best_streak: habit.best_streak
        }).eq('id', id);
        
        await supabase.from('habit_logs').insert([{
          habit_id: id,
          completed_date: new Date().toISOString().split('T')[0]
        }]);
      }
    } catch(err) {}
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-4 cursor-default">
      <div>
        <h2 className="text-[20px] font-medium text-[#4A6B50]">Your Daily</h2>
        <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-tight mt-0.5">Habits & Streaks.</h1>
      </div>

      <div className="space-y-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#224229] rounded-[24px] p-6 text-white shadow-[0_8px_30px_rgb(34,66,41,0.2)] overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A6B50] rounded-full blur-[50px] opacity-50 -mr-10 -mt-10"></div>
          
          <h3 className="text-[16px] font-extrabold mb-1 relative z-10">Keep the streak alive!</h3>
          <p className="text-[#DCE8D7] text-[13px] font-medium mb-6 relative z-10">
            Consistency is key. You're doing 40% better than last week.
          </p>
          
          <div className="relative z-10">
            <p className="text-[#a0c0a3] text-[11px] font-bold uppercase tracking-widest mb-1">Top Streak</p>
            <div className="flex items-end">
              <Flame className="w-8 h-8 text-orange-400 mr-2 -mb-0.5" />
              <span className="text-[40px] leading-none font-black text-white">
                {habits.length > 0 ? Math.max(...habits.map(h => h.best_streak), 0) : 0}
              </span>
              <span className="text-[15px] ml-2 font-bold text-[#DCE8D7] mb-1">days</span>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center relative z-10">
              <div>
                <div className="text-[10px] text-[#a0c0a3] font-bold uppercase tracking-wider mb-0.5">Completion</div>
                <div className="font-bold text-[15px]">{habits.length > 0 ? '85%' : '0%'}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#a0c0a3] font-bold uppercase tracking-wider mb-0.5">Total Habits</div>
                <div className="font-bold text-[15px] text-right">{habits.length}</div>
              </div>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <form onSubmit={addHabit} className="relative z-20">
          <div className="relative flex items-center bg-white rounded-[20px] shadow-sm border border-[#E8EEE5] focus-within:border-[#8BA090] overflow-hidden">
            <input 
              type="text" 
              placeholder="Build a habit (e.g. Read)..." 
              value={newHabit}
              onChange={e => setNewHabit(e.target.value)}
              className="flex-1 px-5 py-4 bg-transparent focus:outline-none text-[14px] font-medium text-[var(--color-primary)] placeholder-[#8BA090]"
            />
            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-[44px] h-[44px] mr-1.5 bg-[var(--color-primary)] text-white font-medium rounded-full hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0 shadow-sm">
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </form>

        <div className="space-y-3 pt-1">
          {isLoading && habits.length === 0 ? (
             Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-[20px] shadow-sm border border-[#E8EEE5] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E8EEE5] animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#E8EEE5] rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-[#E8EEE5] rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))
          ) : habits.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-[24px] border border-[#E8EEE5] shadow-sm mt-4 text-center group"
            >
              <div className="w-16 h-16 bg-[#F6F8F4] rounded-[20px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-8 h-8 text-[#8BA090]" />
              </div>
              <h3 className="text-[18px] font-extrabold text-[var(--color-primary)] mb-1">No Habits Yet</h3>
              <p className="text-[14px] font-medium text-[#8BA090] max-w-[200px] leading-relaxed">
                Small steps every day.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {habits.map(habit => (
                <motion.div 
                  key={habit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[20px] p-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#E8EEE5] flex items-center justify-between group transition-shadow hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => completeHabit(habit.id)}
                      className="relative w-[48px] h-[48px] rounded-full flex items-center justify-center focus:outline-none flex-shrink-0"
                    >
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="21" stroke="#F6F8F4" strokeWidth="4" fill="transparent" />
                        <motion.circle 
                          cx="24" cy="24" r="21" 
                          stroke="#5B8C5A" strokeWidth="4" fill="transparent" 
                          strokeDasharray="132" 
                          initial={{ strokeDashoffset: 132 }}
                          animate={{ strokeDashoffset: habit.current_streak > 0 ? 0 : 132 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 z-10 ${habit.current_streak > 0 ? 'bg-[#5B8C5A] text-white' : 'bg-[#F6F8F4] text-[#8BA090] group-hover:bg-[#E8EEE5]'}`}>
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                    </motion.button>
                    
                    <div className="min-w-0 pr-2">
                      <h4 className="font-extrabold text-[14px] text-[var(--color-primary)] mb-0.5 truncate">{habit.name}</h4>
                      <div className="flex items-center text-[11px] font-semibold text-[#8BA090]">
                        <span className="flex items-center text-orange-500">
                          <Flame className="w-3.5 h-3.5 mr-1" />
                          {habit.current_streak} Day Streak
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-[#F6F8F4] rounded-[14px] px-3 py-2 flex-shrink-0">
                    <Trophy className="w-4 h-4 text-yellow-600 mb-0.5" />
                    <span className="text-[11px] font-bold text-yellow-700">{habit.best_streak}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
