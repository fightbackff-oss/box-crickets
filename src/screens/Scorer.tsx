import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Ball, Innings, Match } from '../types';
import { getLegalBalls, getOversText, getRunRate } from '../lib/scoring';
import { ArrowLeft, AlertCircle, Mic, MicOff, Share2, Download, Zap, ZapOff } from 'lucide-react';
import { useVoiceScoring } from '../hooks/useVoiceScoring';
import html2canvas from 'html2canvas';

export default function Scorer() {
  const navigate = useNavigate();
  const { matches, currentMatchId, updateCurrentMatch } = useStore();
  const match = matches.find((m) => m.id === currentMatchId);
  const [quickMode, setQuickMode] = useState(false);
  const scorecardRef = useRef<HTMLDivElement>(null);

  const handleVoiceCommand = (command: number | 'wicket' | 'wide' | 'noball' | 'undo') => {
    if (typeof command === 'number') {
      handleScore(command);
    } else if (command === 'wicket') {
      handleScore(0, 'none', true);
    } else if (command === 'wide') {
      handleScore(1, 'wide');
    } else if (command === 'noball') {
      handleScore(1, 'noball');
    } else if (command === 'undo') {
      handleUndo();
    }
  };

  const { isListening, startListening, stopListening, isSupported, lastWords } = useVoiceScoring(handleVoiceCommand);

  if (!match) {
    return (
      <div className="flex h-screen items-center justify-center flex-col px-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Match</h2>
        <p className="text-gray-500 mb-6">Create a new match to start scoring.</p>
        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">Go to Dashboard</button>
      </div>
    );
  }

  const isFirstInnings = !match.firstInnings.isComplete;
  const currentInnings = isFirstInnings ? match.firstInnings : match.secondInnings;
  const target = match.targetScore;

  const handleScore = (runs: number, extraType: 'none' | 'wide' | 'noball' = 'none', isWicket: boolean = false) => {
    updateCurrentMatch((m) => {
      const isFirst = !m.firstInnings.isComplete;
      const innings = isFirst ? { ...m.firstInnings } : { ...m.secondInnings };
      
      let actualRuns = runs;
      
      // Last Man Batting Logic
      const isLastManBatting = m.rules?.lastManBatting && innings.wickets === m.playersPerTeam - 1;
      if (isLastManBatting && actualRuns % 2 !== 0 && actualRuns < 4) {
        // odd runs become even (1 -> 2, 3 -> 4) to keep the player on strike
        actualRuns += 1;
      }

      const isLegal = extraType === 'none';
      const newScore = innings.runs + actualRuns;
      const newWickets = innings.wickets + (isWicket ? 1 : 0);
      const prevLegalBalls = innings.balls.filter(b => b.isLegal).length;
      const newLegalBalls = prevLegalBalls + (isLegal ? 1 : 0);
      const overNumber = Math.floor(prevLegalBalls / 6);
      const ballNumberInOver = (prevLegalBalls % 6) + (isLegal ? 1 : 0);
      const runRateAfterBall = parseFloat(getRunRate(newScore, newLegalBalls));
      
      let requiredRateAfterBall;
      if (!isFirst && m.targetScore) {
         requiredRateAfterBall = parseFloat(getRunRate(Math.max(0, m.targetScore - newScore), Math.max(0, m.maxOvers * 6 - newLegalBalls)));
      }

      const newBall: Ball = {
        id: crypto.randomUUID(),
        runs: actualRuns,
        isLegal,
        isWicket,
        extraType,
        timestamp: Date.now(),
        scoreAfterBall: newScore,
        wicketsAfterBall: newWickets,
        overNumber,
        ballNumberInOver,
        runRateAfterBall,
        requiredRateAfterBall,
      };

      innings.balls = [...innings.balls, newBall];
      innings.runs += actualRuns;
      if (isWicket) innings.wickets += 1;

      // Check for innings end
      const legalBalls = innings.balls.filter(b => b.isLegal).length;
      const allowedWickets = m.rules?.lastManBatting ? m.playersPerTeam : m.playersPerTeam; // Last man batting handled by logic
      const allOut = innings.wickets >= allowedWickets && !(m.rules?.lastManBatting && innings.wickets === m.playersPerTeam - 1 && !isWicket); // Wait, if last man is out it's allOut.
      const isActuallyAllOut = innings.wickets >= m.playersPerTeam;

      const maxBalls = m.maxOvers * 6;
      let targetReached = false;

      if (!isFirst && m.targetScore && innings.runs >= m.targetScore) {
        targetReached = true;
      }

      if (legalBalls >= maxBalls || isActuallyAllOut || targetReached) {
        innings.isComplete = true;
      }

      const updatedMatch = { ...m };
      if (isFirst) {
        updatedMatch.firstInnings = innings;
        if (innings.isComplete) {
          updatedMatch.targetScore = innings.runs + 1;
        }
      } else {
        updatedMatch.secondInnings = innings;
        if (innings.isComplete) {
          updatedMatch.status = 'completed';
          if (innings.runs >= updatedMatch.targetScore!) {
            updatedMatch.winner = updatedMatch.secondInnings.teamName;
          } else if (innings.runs === updatedMatch.targetScore! - 1) {
            updatedMatch.winner = 'Tie';
          } else {
            updatedMatch.winner = updatedMatch.firstInnings.teamName;
          }
        }
      }

      return updatedMatch;
    });
  };

  const [showDeclareConfirm, setShowDeclareConfirm] = useState(false);

  const handleEndInnings = () => {
    setShowDeclareConfirm(true);
  };

  const confirmDeclareInnings = () => {
    updateCurrentMatch((m) => {
      const isFirst = !m.firstInnings.isComplete;
      const updatedMatch = { ...m };
      if (isFirst) {
        updatedMatch.firstInnings.isComplete = true;
        updatedMatch.targetScore = updatedMatch.firstInnings.runs + 1;
      } else {
        updatedMatch.secondInnings.isComplete = true;
        updatedMatch.status = 'completed';
        if (updatedMatch.secondInnings.runs >= updatedMatch.targetScore!) {
           updatedMatch.winner = updatedMatch.secondInnings.teamName;
        } else if (updatedMatch.secondInnings.runs === updatedMatch.targetScore! - 1) {
           updatedMatch.winner = 'Tie';
        } else {
           updatedMatch.winner = updatedMatch.firstInnings.teamName;
        }
      }
      return updatedMatch;
    });
    setShowDeclareConfirm(false);
  };

  const handleUndo = () => {
    updateCurrentMatch((m) => {
      let isFirst = !m.firstInnings.isComplete;
      
      // If we are currently in the second innings but no balls have been bowled,
      // and we want to undo, we must revert back to the first innings.
      if (!isFirst && m.secondInnings.balls.length === 0) {
        isFirst = true; // Switch back to first innings
      }

      const innings = isFirst ? { ...m.firstInnings } : { ...m.secondInnings };
      
      if (innings.balls.length === 0) return m; // Nothing to undo

      const lastBall = innings.balls.pop()!;
      innings.runs -= lastBall.runs;
      if (lastBall.isWicket) innings.wickets -= 1;
      innings.isComplete = false; // Always clear completeness when undoing its last ball

      const updatedMatch = { ...m };
      
      if (isFirst) {
        updatedMatch.firstInnings = innings;
        // Since we are back in the first innings, the target score is voided
        updatedMatch.targetScore = undefined;
        // Make sure second innings is reset completely (it should be empty anyway)
        updatedMatch.secondInnings = { ...updatedMatch.secondInnings, isComplete: false };
      } else {
        updatedMatch.secondInnings = innings;
        updatedMatch.status = 'playing'; // Re-activate the match if it was completed
        updatedMatch.winner = undefined;
      }

      return updatedMatch;
    });
  };

  const handleExportImage = async () => {
    if (scorecardRef.current) {
      const canvas = await html2canvas(scorecardRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `BoxScore_${match.teamA}_vs_${match.teamB}.png`;
      a.click();
    }
  };

  if (match.status === 'completed') {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-6 py-12 justify-center pb-24 transition-colors duration-300">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Match Complete</h1>
        <p className="text-blue-600 dark:text-indigo-400 mb-8 uppercase tracking-widest text-xs font-bold transition-colors duration-300">Match Summary</p>
        
        <div ref={scorecardRef} className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 p-6 rounded-3xl mb-8 shadow-md dark:shadow-2xl transition-colors duration-300">
           <div className="flex justify-between items-start mb-6">
             <h2 className="text-2xl font-black italic tracking-tighter uppercase text-blue-600 dark:text-indigo-400 transition-colors duration-300">{match.winner === 'Tie' ? 'Match Tied!' : `${match.winner} Won!`}</h2>
             <span className="text-[10px] uppercase font-bold text-gray-400">BoxScore PRO</span>
           </div>
           <div className="space-y-6">
             <div className="flex justify-between items-center border-b border-gray-200 dark:border-zinc-700/50 pb-6 transition-colors duration-300">
               <div>
                 <p className="font-black italic text-xl uppercase text-gray-900 dark:text-white transition-colors duration-300">{match.firstInnings.teamName}</p>
                 <p className="text-gray-500 dark:text-zinc-500 text-sm font-bold uppercase tracking-widest transition-colors duration-300">{getOversText(match.firstInnings.balls)} Overs</p>
               </div>
               <p className="text-3xl font-black italic text-gray-900 dark:text-white transition-colors duration-300">{match.firstInnings.runs}<span className="text-blue-500 dark:text-indigo-500 text-2xl mx-1 transition-colors duration-300">/</span>{match.firstInnings.wickets}</p>
             </div>
             <div className="flex justify-between items-center">
               <div>
                 <p className="font-black italic text-xl uppercase text-gray-600 dark:text-zinc-300 transition-colors duration-300">{match.secondInnings.teamName}</p>
                 <p className="text-gray-400 dark:text-zinc-500 text-sm font-bold uppercase tracking-widest transition-colors duration-300">{getOversText(match.secondInnings.balls)} Overs</p>
               </div>
               <p className="text-3xl font-black italic text-gray-700 dark:text-zinc-300 transition-colors duration-300">{match.secondInnings.runs}<span className="text-blue-500 dark:text-indigo-500 text-2xl mx-1 transition-colors duration-300">/</span>{match.secondInnings.wickets}</p>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-4">
          <button onClick={handleExportImage} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-4 rounded-2xl font-black uppercase tracking-tighter text-xl active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
            <Download size={24} /> Download Scorecard
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleUndo} className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 text-gray-700 dark:text-zinc-300 px-6 py-5 rounded-2xl font-black uppercase tracking-tighter text-xl active:scale-[0.98] transition-all shadow-sm">
              Undo Ball
            </button>
            <button onClick={() => {
              navigate('/new');
            }} className="bg-green-600 dark:bg-green-500 text-white px-6 py-5 rounded-2xl font-black uppercase tracking-tighter text-xl active:scale-[0.98] transition-all shadow-lg dark:shadow-2xl border-b-4 border-green-800 dark:border-green-700">
              Rematch
            </button>
          </div>
          <button onClick={() => {
            navigate('/');
            useStore.getState().setCurrentMatchId(null);
          }} className="bg-blue-600 dark:bg-indigo-600 text-white px-6 py-5 rounded-2xl font-black uppercase tracking-tighter text-xl active:scale-[0.98] transition-all shadow-lg dark:shadow-2xl border-b-4 border-blue-800 dark:border-indigo-800 w-full mt-2">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 text-gray-900 dark:text-white min-h-screen pb-safe transition-colors duration-300">
      <header className="px-6 py-4 flex items-center justify-between pt-safe border-b border-gray-100 dark:border-zinc-800/50 transition-colors duration-300">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white transition-colors duration-300">
          <ArrowLeft size={24} />
        </button>
        <div className="text-xs font-bold bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest text-gray-600 dark:text-zinc-300 transition-colors duration-300">
          INNINGS {isFirstInnings ? '1' : '2'}
        </div>
        <div className="flex items-center gap-2">
          {isSupported && (
            <button 
              onClick={() => isListening ? stopListening() : startListening()}
              className={`p-2 rounded-full ${isListening ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 animate-pulse' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
            >
              {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
          )}
          <button 
            onClick={() => setQuickMode(!quickMode)}
            className={`p-2 rounded-full ${quickMode ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            {quickMode ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>
        </div>
      </header>

      <section className="px-6 py-4 flex-1 flex flex-col">
        {isListening && lastWords && (
          <div className="mb-2 text-center text-xs font-mono text-gray-500 dark:text-zinc-400">
            Heard: "{lastWords}"
          </div>
        )}
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[10px] text-blue-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-1 transition-colors duration-300 flex items-center gap-2">
              {currentInnings.teamName} Batting
              {match.rules?.lastManBatting && currentInnings.wickets === match.playersPerTeam - 1 && (
                <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded text-[8px] tracking-tight">LAST MAN</span>
              )}
            </p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-8xl font-black italic tracking-tighter leading-none text-gray-900 dark:text-white transition-colors duration-300">{currentInnings.runs}<span className="text-blue-500 dark:text-indigo-500 text-6xl mx-1 transition-colors duration-300">/</span>{currentInnings.wickets}</h1>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-2 text-xs font-mono text-gray-500 dark:text-zinc-400 transition-colors duration-300">
           <span className="bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded text-gray-900 dark:text-white font-black italic text-sm border border-gray-200 dark:border-zinc-700/50 transition-colors duration-300">Overs: {getOversText(currentInnings.balls)} / {match.maxOvers}</span>
           <span className="flex items-center font-bold">CRR: {getRunRate(currentInnings.runs, currentInnings.balls)}</span>
           {target && <span className="flex items-center text-blue-600 dark:text-indigo-400 font-bold transition-colors duration-300">REQ: {getRunRate(Math.max(0, target - currentInnings.runs), Math.max(0, match.maxOvers * 6 - getLegalBalls(currentInnings.balls)))}</span>}
        </div>

        {target && (
          <div className="bg-blue-50 dark:bg-indigo-900/20 border border-blue-200 dark:border-indigo-500/30 rounded-2xl p-3 mb-2 text-center shadow-sm dark:shadow-none text-blue-900 dark:text-indigo-100 transition-colors duration-300">
             <p className="text-[10px] text-blue-600 dark:text-indigo-400 uppercase tracking-widest font-bold mb-1 transition-colors duration-300">Target: {target}</p>
             <p className="text-sm font-bold">Need {Math.max(0, target - currentInnings.runs)} runs in {Math.max(0, (match.maxOvers * 6) - getLegalBalls(currentInnings.balls))} balls</p>
          </div>
        )}

        {/* Live Timeline */}
        {currentInnings.balls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar items-center">
            {[...currentInnings.balls].reverse().slice(0, 10).map((b, idx) => {
              let display = b.runs.toString();
              let style = "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300";
              if (b.isWicket) {
                display = "W";
                style = "bg-red-500 text-white";
              } else if (b.extraType === 'wide') {
                display = b.runs > 1 ? `${b.runs}WD` : "WD";
                style = "bg-gray-200 text-gray-600 border border-gray-300";
              } else if (b.extraType === 'noball') {
                display = b.runs > 1 ? `${b.runs}NB` : "NB";
                style = "bg-gray-200 text-gray-600 border border-gray-300";
              } else if (b.runs === 4 || b.runs === 6) {
                style = "bg-blue-600 text-white";
              }
              
              return (
                <div key={b.id} className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black italic shadow-sm transition-colors duration-300 ${style} ${idx === 0 ? 'ring-2 ring-blue-500 ring-offset-2' : 'opacity-70 scale-90'}`}>
                    {display}
                  </div>
                  {b.overNumber !== undefined && (
                     <span className="text-[8px] font-mono text-gray-500 dark:text-zinc-400 mt-1 font-bold">
                       {b.overNumber}.{b.ballNumberInOver}
                     </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Score Grid */}
        <div className={`${quickMode ? 'grid-cols-2 grid-rows-4' : 'grid-cols-3'} grid gap-2 mb-2 mt-auto`}>
          {[0, 1, 2, 3].map(runs => (
            <button 
              key={runs} 
              onClick={() => handleScore(runs)}
              className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-transparent aspect-square rounded-2xl text-4xl font-black italic active:scale-[0.98] transition-all text-gray-900 dark:text-white shadow-sm dark:shadow-none"
            >
              {runs}
            </button>
          ))}
          <button 
            onClick={() => handleScore(4)}
            className={`bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 rounded-2xl text-5xl font-black italic active:scale-[0.98] transition-all text-white shadow-md dark:shadow-none border-b-4 border-blue-800 dark:border-indigo-800 ${quickMode ? 'aspect-auto' : 'aspect-square'}`}
          >
            4
          </button>
          <button 
            onClick={() => handleScore(6)}
            className={`bg-blue-600 dark:bg-indigo-600 hover:bg-blue-700 dark:hover:bg-indigo-500 rounded-2xl text-5xl font-black italic active:scale-[0.98] transition-all text-white shadow-md dark:shadow-none border-b-4 border-blue-800 dark:border-indigo-800 ${quickMode ? 'aspect-auto' : 'aspect-square'}`}
          >
            6
          </button>
          <button 
            onClick={() => handleScore(0, 'none', true)}
            className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 aspect-square rounded-2xl text-3xl font-black italic active:scale-[0.98] transition-all text-white shadow-sm dark:shadow-none"
          >
            W
          </button>
          <button 
            onClick={() => handleScore(1, 'wide')}
            className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-transparent aspect-square rounded-2xl text-xl font-black uppercase tracking-widest active:scale-[0.98] transition-all text-gray-600 dark:text-zinc-400 shadow-sm dark:shadow-none"
          >
            WD
          </button>
          <button 
            onClick={() => handleScore(1, 'noball')}
            className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-transparent aspect-square rounded-2xl text-xl font-black uppercase tracking-widest active:scale-[0.98] transition-all text-gray-600 dark:text-zinc-400 shadow-sm dark:shadow-none"
          >
            NB
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button 
            onClick={handleUndo} 
            disabled={isFirstInnings && currentInnings.balls.length === 0}
            className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-transparent p-3 rounded-xl flex items-center justify-center text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            Undo Last
          </button>
          <button 
            onClick={handleEndInnings}
            className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-xl flex items-center justify-center text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 active:scale-[0.98] transition-all"
          >
            End Innings
          </button>
        </div>
      </section>

      {/* Declare Innings Confirmation Modal */}
      {showDeclareConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-zinc-800">
             <div className="w-16 h-16 bg-blue-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-indigo-400 mx-auto">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-xl font-black tracking-tighter uppercase text-center mb-2 text-gray-900 dark:text-white">Declare Innings?</h3>
             <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 text-center uppercase tracking-widest mb-8 text-balance">
               Are you sure you want to declare the innings internally? This will end the current innings immediately.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => setShowDeclareConfirm(false)}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmDeclareInnings}
                 className="flex-1 py-4 font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white rounded-2xl active:scale-[0.98] transition-transform"
               >
                 Declare
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
