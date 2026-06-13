import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Play, ShieldCheck, CheckCircle, Settings as SettingsIcon, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { matches, currentMatchId } = useStore();

  const currentMatch = matches.find((m) => m.id === currentMatchId);
  const activeMatches = matches.filter((m) => m.status === 'playing');
  const completedMatches = matches.filter((m) => m.status === 'completed');

  return (
    <div className="px-6 py-12 flex flex-col h-full bg-white dark:bg-zinc-900 transition-colors duration-300">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2 text-gray-900 dark:text-white transition-colors duration-300">BoxScore</h1>
            <p className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1 transition-colors duration-300">
              <ShieldCheck size={14} /> Box Cricket Scoring
            </p>
          </div>
          <div className="text-right">
            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center active:scale-[0.98] transition-transform">
              <SettingsIcon size={20} className="text-gray-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>
      </header>


      <div className="flex-1 space-y-8">
        {currentMatch && currentMatch.status === 'playing' && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-4 transition-colors duration-300">Active Match</h2>
            <div 
              onClick={() => navigate('/scorer')}
              className="bg-blue-600 dark:bg-indigo-600 rounded-3xl p-6 text-white cursor-pointer active:scale-[0.98] transition-all shadow-xl dark:shadow-2xl border border-blue-500 dark:border-indigo-500"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-2 py-1 bg-black/20 text-white text-[10px] font-black uppercase tracking-widest rounded mb-3">Live</span>
                  <div className="flex items-center gap-3 text-xl font-black italic tracking-tighter uppercase">
                    <span>{currentMatch.teamA}</span>
                    <span className="text-blue-200 dark:text-indigo-200 font-sans text-sm not-italic">vs</span>
                    <span>{currentMatch.teamB}</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
              </div>
              <div className="flex bg-black/20 rounded-2xl p-4 gap-4">
                 <div className="flex-1">
                   <p className="text-[10px] text-blue-200 dark:text-indigo-200 font-bold uppercase tracking-widest mb-1 transition-colors duration-300">Target</p>
                   <p className="text-lg font-black italic">{currentMatch.targetScore || '-'}</p>
                 </div>
                 <div className="w-px bg-white/20" />
                 <div className="flex-1">
                   <p className="text-[10px] text-blue-200 dark:text-indigo-200 font-bold uppercase tracking-widest mb-1 transition-colors duration-300">Overs</p>
                   <p className="text-lg font-black italic">{currentMatch.maxOvers}</p>
                 </div>
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-4">
           <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-2xl p-6 shadow-sm transition-colors duration-300">
             <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-2 transition-colors duration-300">Total Matches</p>
             <p className="text-4xl font-black italic tracking-tighter text-gray-900 dark:text-white transition-colors duration-300">{matches.length}</p>
           </div>
           <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-2xl p-6 shadow-sm transition-colors duration-300">
             <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-2 transition-colors duration-300">Completed</p>
             <p className="text-4xl font-black italic tracking-tighter text-blue-600 dark:text-indigo-400 transition-colors duration-300">{completedMatches.length}</p>
           </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/statistics')}
            className="col-span-2 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/50 rounded-2xl p-4 flex justify-between items-center active:scale-[0.98] transition-colors duration-300"
          >
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-indigo-400 transition-colors duration-300">
                <BarChart2 size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mb-0.5 transition-colors duration-300">Records</p>
                <p className="font-bold text-gray-900 dark:text-white uppercase text-sm transition-colors duration-300">View Statistics</p>
              </div>
            </div>
            <p className="text-xs font-black text-blue-600 dark:text-indigo-400 mr-2 transition-colors duration-300">OPEN</p>
          </button>
        </section>

        {!currentMatch || currentMatch.status !== 'playing' ? (
          <button 
            onClick={() => navigate('/new')}
            className="w-full bg-blue-600 dark:bg-indigo-600 text-white rounded-2xl py-5 font-black tracking-tighter uppercase text-xl shadow-xl dark:shadow-2xl active:scale-[0.98] transition-all border-b-4 border-blue-800 dark:border-indigo-800"
          >
            Start New Match
          </button>
        ) : null}
      </div>
    </div>
  );
}
