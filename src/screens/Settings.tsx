import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Trash2, CloudDownload, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { clearAllData, matches } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCloudConfirm, setShowCloudConfirm] = useState(false);

  const handleClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
    navigate('/');
  };

  const handleRestoreCloud = async () => {
    if (!matches || matches.length === 0) {
      await performCloudRestore();
    } else {
      setShowCloudConfirm(true);
    }
  };

  const confirmCloudRestore = async () => {
    setShowCloudConfirm(false);
    await performCloudRestore();
  };

  const performCloudRestore = async () => {
    try {
      const { data, error } = await supabase.from('matches').select('*');
      if (error) {
        console.error("Could not connect to Cloud. " + error.message);
        return;
      }
      
      if (data && data.length > 0) {
        const cloudMatches = data.map((row: any) => row.data);
        const existingIds = new Set(matches.map(m => m.id));
        const newMatches = cloudMatches.filter(m => !existingIds.has(m.id));
        
        if (newMatches.length > 0) {
          useStore.setState(state => ({ matches: [...newMatches, ...state.matches] }));
          // Show a success message in UI instead of window.alert
        }
      }
    } catch (err: any) {
      console.error("Error parsing cloud data: " + err.message);
    }
  };

  return (
    <div className="px-6 py-12 flex flex-col h-full bg-white dark:bg-zinc-900 transition-colors duration-300">
      <header className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white transition-colors duration-300">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-gray-900 dark:text-white transition-colors duration-300">Settings</h1>
          <p className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1 transition-colors duration-300">
            App Configuration
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-6 pb-24">
        <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-3xl p-6 shadow-sm transition-colors duration-300">
           <h2 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest mb-6 transition-colors duration-300">Cloud Sync</h2>
           <div className="flex flex-col gap-4">
             <button 
               onClick={handleRestoreCloud}
               className="w-full bg-blue-50 dark:bg-indigo-900/20 border border-blue-200 dark:border-indigo-500/30 text-blue-600 dark:text-indigo-400 rounded-2xl py-4 font-black uppercase tracking-tighter text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
             >
               <CloudDownload size={20} />
               Restore from Cloud
             </button>
             <p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase tracking-widest font-bold text-center transition-colors duration-300">Automatically syncs matches when scoring</p>
           </div>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-3xl p-6 shadow-sm transition-colors duration-300">
           <h2 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest mb-6 transition-colors duration-300">Data Management</h2>
           <button 
             onClick={handleClearData}
             className="w-full bg-red-50 dark:bg-red-600/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-500 rounded-2xl py-4 font-black uppercase tracking-tighter text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
           >
             <Trash2 size={20} />
             Delete All Data
           </button>
           <p className="text-[10px] text-gray-500 dark:text-zinc-500 uppercase tracking-widest mt-3 font-bold text-center transition-colors duration-300">Removes all local matches & stats</p>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-3xl p-6 shadow-sm transition-colors duration-300">
           <h2 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest mb-6 transition-colors duration-300">About</h2>
           <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-blue-600 dark:bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white italic text-xl transition-colors duration-300">
               BS
             </div>
             <div>
               <p className="font-black italic uppercase text-gray-900 dark:text-white text-lg transition-colors duration-300">BoxScore</p>
               <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest transition-colors duration-300">Version 1.0.0</p>
             </div>
           </div>
           <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-medium transition-colors duration-300">
             A fast and simple box cricket scoring application for local cricket, turf cricket, society cricket, and gully cricket. Uses local storage with Supabase cloud backup.
           </p>
        </div>
      </div>
      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-zinc-800">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-600 dark:text-red-500 mx-auto">
               <AlertTriangle size={32} />
             </div>
             <h3 className="text-xl font-black tracking-tighter uppercase text-center mb-2 text-gray-900 dark:text-white">Delete All Data?</h3>
             <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 text-center uppercase tracking-widest mb-8 text-balance">
               This will permanently remove all match history and statistics. This action cannot be reversed.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowClearConfirm(false)}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmClearData}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Delete All
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Cloud Restore Confirmation Modal */}
      {showCloudConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-zinc-800">
             <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-500 mx-auto">
               <CloudDownload size={32} />
             </div>
             <h3 className="text-xl font-black tracking-tighter uppercase text-center mb-2 text-gray-900 dark:text-white">Restore from Cloud?</h3>
             <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 text-center uppercase tracking-widest mb-8 text-balance">
               This will merge matches from the cloud into your local storage. Proceed?
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowCloudConfirm(false)}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmCloudRestore}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Restore
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
