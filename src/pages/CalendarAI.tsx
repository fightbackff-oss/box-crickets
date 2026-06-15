import React, { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { Sparkles, Loader2, Calendar as CalendarIcon, ChevronLeft, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface PlannedTask {
  title: string;
  description: string;
  timeBlock: string;
  colorClass: string;
}

const pastelColors = [
  'bg-[#FDE7E9] text-[#A65E64]',
  'bg-[#FEF5D9] text-[#A68A3B]',
  'bg-[#E5F5F7] text-[#4A868C]',
  'bg-[#F3E8F5] text-[#8A5B9B]',
];

export default function CalendarAI() {
  const [prompt, setPrompt] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [schedule, setSchedule] = useState<PlannedTask[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  
  const startDate = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const handleAIPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsPlanning(true);
    try {
      const response = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });
      
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      
      if (data.result && data.result.tasks) {
        setSchedule(data.result.tasks.map((t: any, i: number) => ({
          ...t,
          colorClass: pastelColors[i % pastelColors.length]
        })));
        setTips(data.result.productivityTips || []);
        setIsAiModalOpen(false);
        setPrompt('');
        toast.success('Schedule Generates. Have a productive day!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate schedule. Ensure Gemini API key is configured.');
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-5 pb-20 pt-4 cursor-default">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#E8EEE5]">
           <span className="text-[var(--color-primary)] font-bold text-[13px]">{format(new Date(), 'MMMM')}</span>
           <CalendarIcon className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
      </div>

      <div>
        <h2 className="text-[20px] font-medium text-[#4A6B50]">Your Daily</h2>
        <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-tight mt-0.5">Planner, Calendar.</h1>
      </div>

      {/* Date Strip */}
      <div className="flex justify-between items-center mt-6 px-1">
        {weekDays.map((day, idx) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[11px] font-semibold text-[#4A6B50] mb-2 uppercase tracking-wider">{format(day, 'EEE')}</span>
              <div 
                className={`relative w-[40px] h-[40px] rounded-full flex items-center justify-center text-[14px] font-bold transition-colors z-10 ${
                  isToday 
                    ? 'text-white' 
                    : 'bg-white border border-[#E8EEE5] text-[var(--color-primary)] hover:bg-[#F6F8F4]'
                }`}
              >
                {isToday && (
                  <motion.div 
                    layoutId="calendarActiveDay"
                    className="absolute inset-0 bg-[var(--color-primary)] rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Section */}
      <div className="mt-8 bg-white rounded-[24px] p-5 shadow-sm border border-[#E8EEE5]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-bold text-[var(--color-primary)]">{format(new Date(), 'EEEE')}</h3>
          <span className="text-[13px] font-semibold text-[#4A6B50]">{schedule.length} Tasks</span>
        </div>

        {schedule.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-10 px-4 text-center group"
          >
            <div className="w-16 h-16 bg-[#F6F8F4] rounded-[20px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-8 h-8 text-[#8BA090]" />
            </div>
            <h3 className="text-[18px] font-extrabold text-[var(--color-primary)] mb-1">No Events Scheduled</h3>
            <p className="text-[14px] font-medium text-[#8BA090] max-w-[200px] leading-relaxed mb-4">
              Your day is completely free!
            </p>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="px-6 py-2 bg-[#F6F8F4] text-[var(--color-primary)] font-bold text-[13px] rounded-[12px] flex items-center shadow-sm hover:bg-[#E8EEE5] transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Plan with AI
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4 relative before:content-[''] before:absolute before:left-[45px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {schedule.map((task, idx) => {
              const isBreak = task.title.toLowerCase().includes('break') || task.title.toLowerCase().includes('breakfast');
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="flex items-start group relative"
                >
                  <div className="w-[85px] flex-shrink-0 pt-1 z-10 bg-white">
                    <div className="text-[13px] font-bold text-[var(--color-primary)] text-right pr-6">{task.timeBlock.split(' ')[0]}</div>
                    <div className="text-[10px] font-semibold text-[#4A6B50] text-right pr-6 mt-0.5">{task.timeBlock.split(' ')[1]}</div>
                  </div>
                  
                  {isBreak ? (
                     <div className="flex-1 mt-2 flex items-center">
                       <div className="h-px bg-purple-200 w-full relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                       </div>
                       <span className="text-[11px] font-semibold text-purple-600 bg-white px-2.5 py-0.5 whitespace-nowrap mx-2 rounded-full border border-purple-100">
                         {task.title}
                       </span>
                       <div className="h-px bg-purple-200 w-full relative"></div>
                     </div>
                  ) : (
                    <div className={`flex-1 ${task.colorClass.split(' ')[0]} rounded-[16px] p-3 flex items-center relative z-10 transition-transform hover:scale-[1.02] border border-black/5`}>
                       <div className="w-9 h-9 rounded-[10px] bg-white/40 flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden shadow-sm">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.title)}&background=fff&color=333`} alt={task.title} className="w-full h-full object-cover" />
                       </div>
                       <div>
                         <h4 className={`font-bold text-[14px] ${task.colorClass.split(' ')[1]}`}>{task.title}</h4>
                         <div className="flex items-center text-[11px] font-medium opacity-80 mt-0.5 mix-blend-multiply">
                           {task.description}
                         </div>
                       </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Planner Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#F6F8F4]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsAiModalOpen(false)}
          >
            <motion.div 
              initial={{ y: 40, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 40, scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--color-primary)] rounded-[32px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl text-white font-extrabold flex items-center mb-5">
                <Sparkles className="w-5 h-5 mr-3 text-[#DCE8D7]" />
                AI Planner
              </h3>
              
              <p className="text-[#a0c0a3] text-[14px] font-medium mb-6">Describe your day and let AI perfectly organize your schedule and breaks.</p>
              
              <form onSubmit={handleAIPlan}>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. "I have CPA study, a client meeting at 2pm, and need a workout break..."'
                  className="w-full h-28 px-4 py-3.5 rounded-[16px] bg-white/10 border border-white/20 text-white placeholder-[#a0c0a3] focus:outline-none focus:ring-2 focus:ring-[#DCE8D7] resize-none mb-5 text-[14px] font-medium transition-all"
                />
                <button
                  type="submit"
                  disabled={isPlanning}
                  className="w-full py-3.5 bg-[#DCE8D7] text-[var(--color-primary)] font-bold rounded-[16px] hover:bg-white transition-colors flex items-center justify-center text-[15px] shadow-sm disabled:opacity-70 active:scale-95"
                >
                  {isPlanning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Schedule'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button 
        onClick={() => setIsAiModalOpen(true)}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 w-14 h-14 bg-[var(--color-primary)] text-white rounded-[20px] flex items-center justify-center shadow-lg z-40 outline-none"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Sparkles className="w-6 h-6 text-[#DCE8D7]" />
      </motion.button>

    </div>
  );
}
