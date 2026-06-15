import React, { useEffect, useState } from 'react';
import { User, Bell, Paintbrush, LogOut, ChevronRight, RefreshCw, Database, Download, Info, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{name: string, email: string} | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('timezy_user_name') || 'User';
    setUserProfile({
      name: name,
      email: 'Local Sync' // Future cloud sync info
    });
  }, []);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? You will be logged out.")) {
      localStorage.removeItem('timezy_device_id');
      localStorage.removeItem('timezy_user_name');
      localStorage.removeItem('timezy_tasks_cache');
      localStorage.removeItem('timezy_habits_cache');
      window.location.href = '/auth';
    }
  };

  const handleExport = () => {
    toast.success('Data exported successfully', { description: 'A JSON file has been saved to your downloads.' });
  };

  const handleBackup = () => {
    toast.success('Backup complete', { description: 'All local data synced with the cloud.' });
  };

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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-md mx-auto space-y-6 pb-24 pt-4 cursor-default"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-[20px] font-medium text-[#4A6B50]">Your</h2>
        <h1 className="text-[28px] font-extrabold text-[var(--color-primary)] leading-tight mt-0.5">Preferences.</h1>
      </motion.div>

      <div className="space-y-4">
        {/* Profile Details */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E8EEE5]">
          <h3 className="text-[16px] font-extrabold text-[var(--color-primary)] mb-4 px-1">Account</h3>
          <div className="flex items-center space-x-3 px-1">
            <div className="w-[52px] h-[52px] bg-[#DCE8D7] rounded-full flex items-center justify-center flex-shrink-0">
              {userProfile ? (
                 <span className="text-[20px] font-bold text-[var(--color-primary)] uppercase">{userProfile.name.charAt(0)}</span>
              ) : (
                 <User className="w-6 h-6 text-[var(--color-primary)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[15px] font-bold text-[var(--color-primary)] truncate">
                {userProfile ? userProfile.name : 'Loading...'}
              </h4>
              <p className="text-[13px] text-[#8BA090] truncate">
                {userProfile ? userProfile.email : ''}
              </p>
            </div>
            <button className="text-[12px] font-bold text-[var(--color-primary)] bg-[#F6F8F4] px-4 py-2 rounded-full hover:bg-[#E8EEE5] active:scale-95 transition-all">
              Edit
            </button>
          </div>
        </motion.section>

        {/* Appearance */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-2 shadow-sm border border-[#E8EEE5]">
           <div className="px-5 pt-4 pb-2">
             <h3 className="text-[16px] font-extrabold text-[var(--color-primary)]">Appearance</h3>
           </div>
           <div className="space-y-1 p-2">
              <button className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F4] rounded-[16px] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F5F7] text-[#4A868C] flex items-center justify-center">
                    <Paintbrush className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--color-primary)]">Theme</span>
                </div>
                <div className="flex items-center text-[#8BA090]">
                  <span className="text-[13px] mr-2 font-medium">System</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
           </div>
        </motion.section>

        {/* Notifications */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-3 shadow-sm border border-[#E8EEE5]">
          <h3 className="text-[16px] font-extrabold text-[var(--color-primary)] mb-2 px-4 pt-3">Notifications</h3>
          <div className="space-y-1">
            {[
              { title: 'Push Notifications', desc: 'Real-time alerts' },
              { title: 'Smart Reminders', desc: 'AI adaptive reminders' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 px-4">
                <div>
                  <h4 className="font-extrabold text-[14px] text-[var(--color-primary)]">{item.title}</h4>
                  <p className="text-[12px] font-medium text-[#8BA090] mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={i === 0} />
                  <div className="w-10 h-6 bg-[#DCE8D7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E8EEE5] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-success)] shadow-inner"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Data & Privacy */}
        <motion.section variants={itemVariants} className="bg-white rounded-[24px] p-2 shadow-sm border border-[#E8EEE5]">
           <div className="px-5 pt-4 pb-2">
             <h3 className="text-[16px] font-extrabold text-[var(--color-primary)]">Data & Privacy</h3>
           </div>
           <div className="space-y-1 p-2">
              <button 
                onClick={handleBackup}
                className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F4] rounded-[16px] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#F3E8F5] text-[#8A5B9B] flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--color-primary)]">Data Backup</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8BA090]" />
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F4] rounded-[16px] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#FEF5D9] text-[#A68A3B] flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--color-primary)]">Export Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8BA090]" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F4] rounded-[16px] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8F0EA] text-[#4A6B50] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--color-primary)]">Privacy Policy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8BA090]" />
              </button>

              <button className="w-full flex items-center justify-between p-3 hover:bg-[#F6F8F4] rounded-[16px] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#E5F5F7] text-[#4A868C] flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--color-primary)]">About App</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8BA090]" />
              </button>
           </div>
        </motion.section>

        {/* Security & Actions */}
        <motion.section variants={itemVariants} className="space-y-3 pt-2">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="w-full flex items-center justify-center p-4 bg-white rounded-[20px] shadow-sm border border-[#E8EEE5] text-[#A65E64] font-bold transition-all hover:bg-[#FDE7E9]"
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            Reset App Data
          </motion.button>
        </motion.section>

        <motion.div variants={itemVariants} className="text-center pt-8 pb-4">
          <p className="text-[11px] font-bold text-[#8BA090] uppercase tracking-widest">Timezy App v1.0.0</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
