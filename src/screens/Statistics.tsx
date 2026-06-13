import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Match } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { ArrowLeft, Users, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Statistics() {
  const { matches, theme } = useStore();
  const navigate = useNavigate();

  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  const now = Date.now();
  const filteredMatches = matches.filter(m => {
    if (timeFilter === 'all') return true;
    if (timeFilter === 'week') return now - m.createdAt < 7 * 24 * 60 * 60 * 1000;
    if (timeFilter === 'month') return now - m.createdAt < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const completedMatches = filteredMatches.filter(m => m.status === 'completed');

  const stats = useMemo(() => {
    let totalRuns = 0;
    let highestScore = 0;
    let highestChase = 0;
    const winsByTeam: Record<string, number> = {};

    completedMatches.forEach(m => {
      totalRuns += m.firstInnings.runs + m.secondInnings.runs;
      
      if (m.firstInnings.runs > highestScore) highestScore = m.firstInnings.runs;
      if (m.secondInnings.runs > highestScore) highestScore = m.secondInnings.runs;

      if (m.winner === m.secondInnings.teamName && m.secondInnings.runs > highestChase) {
        highestChase = m.secondInnings.runs;
      }

      if (m.winner && m.winner !== 'Tie') {
        winsByTeam[m.winner] = (winsByTeam[m.winner] || 0) + 1;
      }
    });

    const averageTeamScore = completedMatches.length > 0 
      ? Math.round(totalRuns / (completedMatches.length * 2)) 
      : 0;

    let mostWinsTeam = '-';
    let maxWins = 0;
    Object.entries(winsByTeam).forEach(([team, wins]) => {
      if (wins > maxWins) {
        maxWins = wins;
        mostWinsTeam = team;
      }
    });

    // Chart data: Run trend over time
    const trendData = [...completedMatches].reverse().map(m => {
      return {
        date: new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        runs: m.firstInnings.runs + m.secondInnings.runs,
        avg: averageTeamScore
      };
    });

    return {
      totalMatches: completedMatches.length,
      totalRuns,
      averageTeamScore,
      highestScore,
      highestChase,
      mostWinsTeam,
      maxWins,
      trendData
    };
  }, [completedMatches]);

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const textColor = isDark ? '#a1a1aa' : '#71717a'; // zinc-400 / zinc-500
  const gridColor = isDark ? '#3f3f46' : '#e4e4e7'; // zinc-700 / zinc-200
  const accentColor = isDark ? '#818cf8' : '#2563eb'; // indigo-400 / blue-600

  return (
    <div className="px-6 py-12 flex flex-col h-full bg-white dark:bg-zinc-900 transition-colors duration-300 overflow-y-auto pb-24">
      <header className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white transition-colors duration-300">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-gray-900 dark:text-white transition-colors duration-300">Statistics</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest transition-colors duration-300">Analytics Dashboard</p>
        </div>
      </header>

      {matches.length === 0 ? (
         <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest">
           No match data available
         </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2">
            {(['all', 'month', 'week'] as const).map(filter => (
              <button 
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === filter ? 'bg-blue-600 dark:bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-5 rounded-3xl transition-colors duration-300">
               <Trophy size={20} className="text-blue-500 dark:text-indigo-400 mb-2" />
               <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest transition-colors duration-300">Top Team</p>
               <p className="text-xl font-black italic tracking-tighter text-gray-900 dark:text-white truncate">{stats.mostWinsTeam}</p>
               <p className="text-xs font-bold text-blue-600 dark:text-indigo-400">{stats.maxWins} wins</p>
             </div>
             <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-5 rounded-3xl transition-colors duration-300">
               <TrendingUp size={20} className="text-green-500 dark:text-emerald-400 mb-2" />
               <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest transition-colors duration-300">Highest Score</p>
               <p className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-white">{stats.highestScore}</p>
             </div>
             <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-5 rounded-3xl transition-colors duration-300">
               <span className="text-lg font-black italic text-orange-500 dark:text-orange-400 block mb-2">AVG</span>
               <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest transition-colors duration-300">Avg Innings</p>
               <p className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-white">{stats.averageTeamScore}</p>
             </div>
             <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-5 rounded-3xl transition-colors duration-300">
               <Users size={20} className="text-purple-500 dark:text-purple-400 mb-2" />
               <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest transition-colors duration-300">Highest Chase</p>
               <p className="text-2xl font-black italic tracking-tighter text-gray-900 dark:text-white">{stats.highestChase}</p>
             </div>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-6 rounded-3xl transition-colors duration-300">
             <h2 className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest mb-6">Runs Matrix</h2>
             {stats.trendData.length > 0 ? (
               <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                         <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                     <XAxis dataKey="date" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                     <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: isDark ? '#18181b' : '#ffffff', 
                         borderColor: isDark ? '#3f3f46' : '#e4e4e7',
                         borderRadius: '12px',
                         fontWeight: 'bold'
                       }} 
                       itemStyle={{ color: accentColor }}
                     />
                     <Area type="monotone" dataKey="runs" stroke={accentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorRuns)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             ) : (
               <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 text-center py-8">Not enough data points</p>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
