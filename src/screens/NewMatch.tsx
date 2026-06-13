import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Match, CustomRules } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function NewMatch() {
  const navigate = useNavigate();
  const addMatch = useStore((state) => state.addMatch);

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState('6');
  const [players, setPlayers] = useState('10');
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState<CustomRules>({
    oneTipOneHandOut: false,
    directCatchOut: true,
    hitRoofOut: false,
    hitNetTwoRuns: false,
    hitSideNetOneRun: false,
    lastManBatting: false
  });

  const toggleRule = (key: keyof CustomRules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = () => {
    if (!teamA || !teamB || !tossWinner) return;

    const newMatch: Match = {
      id: crypto.randomUUID(),
      teamA,
      teamB,
      maxOvers: parseInt(overs),
      playersPerTeam: parseInt(players),
      tossWinner,
      tossDecision,
      status: 'playing',
      createdAt: Date.now(),
      rules,
      firstInnings: {
        teamName: tossDecision === 'bat' ? tossWinner : (tossWinner === teamA ? teamB : teamA),
        balls: [],
        runs: 0,
        wickets: 0,
        isComplete: false,
      },
      secondInnings: {
        teamName: tossDecision === 'bowl' ? tossWinner : (tossWinner === teamA ? teamB : teamA),
        balls: [],
        runs: 0,
        wickets: 0,
        isComplete: false,
      }
    };

    addMatch(newMatch);
    navigate('/scorer');
  };

  return (
    <div className="px-6 py-12 pb-32 flex flex-col min-h-full bg-white dark:bg-zinc-900 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-gray-900 dark:text-white transition-colors duration-300">New Match</h1>
        <p className="text-sm font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest transition-colors duration-300">Match Configuration</p>
      </header>

      <div className="space-y-6 flex-1">
        <section className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Team A</label>
            <input
              type="text"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700/50 rounded-2xl px-5 py-4 text-xl font-black italic focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600"
              placeholder="e.g. Warriors CC"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Team B</label>
            <input
              type="text"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700/50 rounded-2xl px-5 py-4 text-xl font-black italic focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600"
              placeholder="e.g. Titans XI"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Overs</label>
            <select
              value={overs}
              onChange={(e) => setOvers(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700/50 rounded-2xl px-5 py-4 text-xl font-black italic text-blue-600 dark:text-indigo-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all appearance-none"
            >
              {[2, 4, 6, 8, 10, 12, 15, 20].map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Wickets</label>
            <select
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700/50 rounded-2xl px-5 py-4 text-xl font-black italic text-blue-600 dark:text-indigo-400 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-blue-500 dark:focus:border-indigo-500 transition-all appearance-none"
            >
              {[2, 4, 6, 8, 10].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="border border-gray-200 dark:border-zinc-700/50 rounded-2xl overflow-hidden transition-colors duration-300">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="w-full bg-gray-50 dark:bg-zinc-800 px-5 py-4 flex justify-between items-center transition-colors duration-300"
          >
            <span className="font-bold text-sm uppercase tracking-widest text-gray-700 dark:text-zinc-300">Box Cricket Rules</span>
            {showRules ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </button>
          
          {showRules && (
            <div className="p-5 space-y-4 bg-white dark:bg-zinc-900 transition-colors duration-300 border-t border-gray-200 dark:border-zinc-700/50">
              {Object.entries({
                lastManBatting: 'Last Man Batting',
                oneTipOneHandOut: 'One Tip One Hand Out',
                hitRoofOut: 'Hit Roof Out',
                hitNetTwoRuns: 'Hit Net = 2 Runs',
                hitSideNetOneRun: 'Hit Side Net = 1 Run'
              }).map(([key, label]) => (
                 <label key={key} onClick={() => toggleRule(key as keyof CustomRules)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-sm font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-wide group-hover:text-blue-600 transition-colors">{label}</span>
                   <div className={`w-12 h-6 rounded-full p-1 transition-colors ${rules[key as keyof CustomRules] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`}>
                     <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${rules[key as keyof CustomRules] ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                 </label>
              ))}
            </div>
          )}
        </section>

        {(teamA && teamB) ? (
          <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800 transition-colors duration-300">
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Toss Won By</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setTossWinner(teamA)}
                className={`flex-1 py-4 rounded-2xl font-black italic uppercase text-lg border-2 transition-all ${tossWinner === teamA ? 'bg-blue-600 dark:bg-indigo-600 border-blue-500 dark:border-indigo-500 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
              >
                {teamA}
              </button>
              <button 
                onClick={() => setTossWinner(teamB)}
                className={`flex-1 py-4 rounded-2xl font-black italic uppercase text-lg border-2 transition-all ${tossWinner === teamB ? 'bg-blue-600 dark:bg-indigo-600 border-blue-500 dark:border-indigo-500 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
              >
                {teamB}
              </button>
            </div>
            
            {tossWinner && (
              <div className="pt-4">
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2 transition-colors duration-300">Decision</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTossDecision('bat')}
                    className={`flex-1 py-4 rounded-2xl font-black italic uppercase text-lg border-2 transition-all ${tossDecision === 'bat' ? 'bg-blue-600 dark:bg-indigo-600 border-blue-500 dark:border-indigo-500 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                  >
                    Bat
                  </button>
                  <button 
                    onClick={() => setTossDecision('bowl')}
                    className={`flex-1 py-4 rounded-2xl font-black italic uppercase text-lg border-2 transition-all ${tossDecision === 'bowl' ? 'bg-blue-600 dark:bg-indigo-600 border-blue-500 dark:border-indigo-500 text-white' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                  >
                    Bowl
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}

        <div className="mt-8">
          <button 
            onClick={handleStart}
            disabled={!teamA || !teamB || !tossWinner}
            className="w-full bg-blue-600 dark:bg-indigo-600 disabled:bg-gray-200 dark:disabled:bg-zinc-800 disabled:text-gray-400 dark:disabled:text-zinc-600 disabled:border-gray-200 dark:disabled:border-zinc-800 text-white rounded-2xl py-5 font-black uppercase tracking-tighter text-xl shadow-xl dark:shadow-2xl active:scale-[0.98] transition-all border-b-4 border-blue-800 dark:border-indigo-800 disabled:border-b-gray-200 dark:disabled:border-b-zinc-800 hover:bg-blue-700 dark:hover:bg-indigo-500"
          >
            Start Match
          </button>
          <p className="text-center text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-4 font-bold border-t border-gray-100 dark:border-zinc-800/50 pt-4 transition-colors duration-300">BoxScore Offline</p>
        </div>
      </div>
    </div>
  );
}
