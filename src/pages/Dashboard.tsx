import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, CircleDot, UserCircle, CheckCircle, ChevronRight, Bell, Blocks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    ongoing: 0,
    pending: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        const name = localStorage.getItem('timezy_user_name') || 'User';
        setUserName(name);
        
        // Cache priority
        const cached = localStorage.getItem('timezy_tasks_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          let completed = 0;
          let ongoing = 0;
          let pending = 0;
          parsed.forEach((task: any) => {
            if (task.status === 'Completed') completed++;
            else if (task.status === 'In Progress') ongoing++;
            else pending++;
          });
          setStats({ total: parsed.length, completed, ongoing, pending });
        }

        // Safe check for preview
        if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
           setIsLoading(false);
           return;
        }

        const { data, error } = await supabase
          .from('tasks')
          .select('status');
        
        if (error) throw error;
        
        let completed = 0;
        let ongoing = 0;
        let pending = 0;
        
        data?.forEach((task: any) => {
          if (task.status === 'Completed') completed++;
          else if (task.status === 'In Progress') ongoing++;
          else pending++;
        });
        
        setStats({
          total: data?.length || 0,
          completed,
          ongoing,
          pending
        });
      } catch (err) {
        console.error("Supabase error.", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Tasks', value: stats.total, icon: Blocks, bg: 'bg-[#E8F0E4]', iconColor: 'text-[var(--color-primary)]' },
    { title: 'Pending', value: stats.pending, icon: UserCircle, bg: 'bg-[#E8F0EA]', iconColor: 'text-[#4A6B50]' },
    { title: 'Ongoing', value: stats.ongoing, icon: CircleDot, bg: 'bg-[#F3E8F5]', iconColor: 'text-[#8A5B9B]' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle, bg: 'bg-[#F5F2DF]', iconColor: 'text-[#9C8F3A]' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-24 h-4 bg-[#E8EEE5] rounded animate-pulse"></div>
            <div className="w-40 h-8 bg-[#E8EEE5] rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="w-[44px] h-[44px] bg-[#E8EEE5] rounded-full animate-pulse"></div>
            <div className="w-[44px] h-[44px] bg-[#E8EEE5] rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="w-full h-[96px] bg-[#E8EEE5] rounded-[24px] animate-pulse"></div>
        <div className="grid grid-cols-2 gap-3 mt-6">
           <div className="h-[110px] bg-[#E8EEE5] rounded-[24px] animate-pulse"></div>
           <div className="h-[110px] bg-[#E8EEE5] rounded-[24px] animate-pulse"></div>
           <div className="h-[110px] bg-[#E8EEE5] rounded-[24px] animate-pulse"></div>
           <div className="h-[110px] bg-[#E8EEE5] rounded-[24px] animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5 max-w-2xl mx-auto pt-4 relative cursor-default"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-[14px] font-semibold text-[#8BA090] mb-0.5">
             <span className="mr-1.5 text-yellow-500">☀️</span> Good Morning
          </div>
          <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-tight">{userName}</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="w-[44px] h-[44px] rounded-full bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm border border-[#E8EEE5] hover:bg-[#F6F8F4] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-[44px] h-[44px] rounded-full bg-[#DCE8D7] flex items-center justify-center shadow-sm overflow-hidden border border-[#E8EEE5]">
            <span className="text-lg font-bold text-[var(--color-primary)]">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </motion.div>

      {/* Create New Task Action Card */}
      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/tasks')}
        className="w-full bg-white rounded-[24px] h-[96px] px-5 flex items-center justify-between shadow-sm border border-[#E8EEE5]"
      >
        <div className="flex items-center">
          <div className="w-[48px] h-[48px] rounded-[16px] bg-[var(--color-primary)] text-white flex items-center justify-center mr-4">
             <Calendar className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-[22px] font-extrabold text-[var(--color-primary)] leading-tight">Create New Task</h3>
            <p className="text-[#8BA090] text-[14px] mt-0.5 font-medium">Add something to your list</p>
          </div>
        </div>
        <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#8BA090]">
          <ChevronRight className="w-5 h-5" />
        </div>
      </motion.button>

      {/* Summary Grid */}
      <motion.div variants={itemVariants} className="mt-6">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, idx) => (
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -2 }}
              key={idx} 
              className="bg-white p-4 rounded-[24px] flex flex-col justify-between shadow-sm border border-[#E8EEE5] h-[116px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-[32px] h-[32px] rounded-full ${stat.bg} ${stat.iconColor} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <h3 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-none">{stat.value}</h3>
              </div>
              <p className="text-[14px] font-bold text-[#8BA090] mt-auto uppercase tracking-wide">{stat.title}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity Section */}
      {stats.completed > 0 ? (
        <motion.div variants={itemVariants} className="bg-[#DCE8D7] rounded-[24px] p-6 mt-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-[44px] h-[44px] rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center mr-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[var(--color-primary)]">Great Progress!</h3>
              <p className="text-[#4A6B50] text-[14px] font-medium leading-tight mt-0.5">You've completed {stats.completed} tasks.</p>
            </div>
          </div>
        </motion.div>
      ) : stats.total > 0 ? (
        <motion.div variants={itemVariants} className="bg-[#FEF5D9] rounded-[24px] p-6 mt-6 shadow-sm flex items-center justify-between border border-[#E8EEE5]">
          <div className="flex items-center">
            <div className="w-[44px] h-[44px] rounded-full bg-[#A68A3B] text-white flex items-center justify-center mr-4">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#A68A3B]">Time to hustle!</h3>
              <p className="text-[#a68a3b]/80 text-[14px] font-medium leading-tight mt-0.5">You have {stats.pending} tasks pending.</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="bg-[#F6F8F4] border border-dashed border-[#8BA090] rounded-[24px] p-6 mt-6 flex flex-col items-center justify-center text-center">
          <div className="w-[48px] h-[48px] rounded-full bg-[#E8EEE5] flex items-center justify-center mb-3">
            <Blocks className="w-6 h-6 text-[#8BA090]" />
          </div>
          <h3 className="text-[16px] font-bold text-[var(--color-primary)]">No tasks yet</h3>
          <p className="text-[#8BA090] text-[14px] mt-1 font-medium">Start by creating your first task.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
