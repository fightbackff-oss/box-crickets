import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { getOversText } from '../lib/scoring';
import { format } from 'date-fns';

export default function MatchHistory() {
  const navigate = useNavigate();
  const { matches } = useStore();

  const sortedMatches = [...matches].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="px-6 py-12 pb-32 h-full overflow-y-auto bg-white dark:bg-zinc-900 transition-colors duration-300">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-gray-900 dark:text-white transition-colors duration-300">Match History</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest transition-colors duration-300">Verified records.</p>
        </div>
      </header>

      {sortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-zinc-600 font-medium transition-colors duration-300">No matches recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMatches.map(match => (
            <div 
              key={match.id}
              onClick={() => navigate(`/match/${match.id}`)}
              className={`bg-white dark:bg-zinc-800 border-l-4 border-y border-r border-gray-200 dark:border-zinc-700 text-left w-full rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer ${
                match.status === 'playing' ? 'border-l-green-500' : 'border-l-blue-500 dark:border-l-indigo-500'
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors duration-300 ${
                  match.status === 'playing' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-indigo-500/20 text-blue-700 dark:text-indigo-400'
                }`}>
                  {match.status}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono transition-colors duration-300">
                  {format(match.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
              
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="uppercase text-gray-900 dark:text-white transition-colors duration-300">{match.firstInnings.teamName}</span>
                <span className="text-blue-600 dark:text-indigo-400 transition-colors duration-300">{match.firstInnings.runs}/{match.firstInnings.wickets} <span className="text-[10px] font-normal text-gray-500 dark:text-zinc-500 ml-1">({getOversText(match.firstInnings.balls)})</span></span>
              </div>
              <div className="flex justify-between text-sm font-bold mb-4">
                <span className="uppercase text-gray-500 dark:text-zinc-400 transition-colors duration-300">{match.secondInnings.teamName}</span>
                <span className="text-gray-600 dark:text-zinc-300 transition-colors duration-300">{match.secondInnings.runs}/{match.secondInnings.wickets} <span className="text-[10px] font-normal text-gray-500 dark:text-zinc-500 ml-1">({getOversText(match.secondInnings.balls)})</span></span>
              </div>
              
              {match.status === 'completed' && match.winner && (
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-700 transition-colors duration-300">
                  <p className="text-xs uppercase tracking-widest font-black text-gray-900 dark:text-white transition-colors duration-300">
                    {match.winner === 'Tie' ? 'Match Tied' : `${match.winner} WON`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
