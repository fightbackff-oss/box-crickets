import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Download } from 'lucide-react';
import { getOversText, getLegalBalls, getRunRate } from '../lib/scoring';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches } = useStore();
  
  const match = matches.find(m => m.id === id);
  const [activeTab, setActiveTab] = useState<'summary' | 'scorecard' | 'timeline' | 'overs'>('summary');
  const [activeInning, setActiveInning] = useState<1 | 2>(1);
  const scorecardRef = useRef<HTMLDivElement>(null);

  if (!match) {
    return (
      <div className="flex flex-col h-full bg-white text-gray-900 px-6 py-12 justify-center pb-24">
        <h1 className="text-3xl font-black mb-2 uppercase">Match Not Found</h1>
        <button onClick={() => navigate('/history')} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-black uppercase text-lg active:scale-[0.98]">
          Back to History
        </button>
      </div>
    );
  }

  const getChartData = () => {
    const data: any[] = [{ over: 0, i1: 0, i2: 0 }];
    let i1Total = 0;
    let i2Total = 0;

    for (let over = 1; over <= match.maxOvers; over++) {
      let r1 = 0; let b1 = false;
      for (let i = 0; i < match.firstInnings.balls.length; i++) {
        if (Math.floor(getLegalBalls(match.firstInnings.balls.slice(0, i)) / 6) === over - 1) {
          r1 += match.firstInnings.balls[i].runs;
          b1 = true;
        }
      }
      if (b1) i1Total += r1;

      let r2 = 0; let b2 = false;
      for (let i = 0; i < match.secondInnings.balls.length; i++) {
        if (Math.floor(getLegalBalls(match.secondInnings.balls.slice(0, i)) / 6) === over - 1) {
          r2 += match.secondInnings.balls[i].runs;
          b2 = true;
        }
      }
      if (b2) i2Total += r2;

      data.push({
        over,
        i1: (b1 || match.firstInnings.isComplete) ? i1Total : null,
        i2: (match.secondInnings.balls.length > 0 && (b2 || match.secondInnings.isComplete)) ? i2Total : null,
      });
    }
    return data;
  };

  const currentInningData = activeInning === 1 ? match.firstInnings : match.secondInnings;

  const groupedOvers = useMemo(() => {
    const overs: Record<number, { balls: typeof match.firstInnings.balls, runs: number }> = {};
    let currentOverIndex = 0;
    // We rebuild overs using logic or overNumber prop
    currentInningData.balls.forEach(b => {
      const overIndex = b.overNumber !== undefined ? b.overNumber : currentOverIndex;
      if (!overs[overIndex]) overs[overIndex] = { balls: [], runs: 0 };
      overs[overIndex].balls.push(b);
      overs[overIndex].runs += b.runs;
      if (b.isWicket) overs[overIndex].runs += 0; // Just visual tracking
    });
    return overs;
  }, [currentInningData]);

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

  const renderTimeline = (innings: typeof match.firstInnings) => {
    return (
      <div className="space-y-3 mt-4">
        {innings.balls.map((ball, i) => {
          const legalBallsBefore = getLegalBalls(innings.balls.slice(0, i));
          const over = ball.overNumber !== undefined ? ball.overNumber : Math.floor(legalBallsBefore / 6);
          const ballInOver = ball.ballNumberInOver !== undefined ? ball.ballNumberInOver : (legalBallsBefore % 6) + (!ball.isLegal ? 0 : 1);
          
          let display = ball.runs.toString();
          let style = "bg-gray-100 text-gray-700 border border-gray-200";
          if (ball.isWicket) {
             display = "W";
             style = "bg-red-500 text-white";
          } else if (ball.extraType === 'wide') {
             display = ball.runs > 1 ? `${ball.runs}WD` : "WD";
             style = "bg-gray-200 text-gray-600 border border-gray-300";
          } else if (ball.extraType === 'noball') {
             display = ball.runs > 1 ? `${ball.runs}NB` : "NB";
             style = "bg-gray-200 text-gray-600 border border-gray-300";
          } else if (ball.runs === 4 || ball.runs === 6) {
             style = "bg-blue-600 text-white";
          }

          return (
            <div key={ball.id} className="flex gap-4 items-center bg-gray-50 border border-gray-100 p-3 rounded-2xl">
              <div className="w-12 text-xs font-mono text-gray-400 font-bold uppercase tracking-widest text-right">
                {over}.{ballInOver}
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black italic text-lg shadow-sm ${style}`}>
                {display}
              </div>
              <div className="flex-1">
                {ball.scoreAfterBall !== undefined && (
                  <p className="text-xs font-bold text-gray-500">Score: {ball.scoreAfterBall}/{ball.wicketsAfterBall}</p>
                )}
              </div>
              {ball.timestamp && (
                 <div className="text-[10px] font-mono text-gray-400 ml-auto font-bold">
                    {format(ball.timestamp, 'HH:mm')}
                 </div>
              )}
            </div>
          );
        })}
        {innings.balls.length === 0 && (
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-center py-4">No balls recorded</p>
        )}
      </div>
    );
  };

  const getInningsStats = (innings: typeof currentInningData) => {
     let boundaries = 0;
     let sixes = 0;
     let wides = 0;
     let noballs = 0;
     let dotBalls = 0;

     innings.balls.forEach(b => {
         if (b.runs === 4) boundaries++;
         if (b.runs === 6) sixes++;
         if (b.extraType === 'wide') wides++;
         if (b.extraType === 'noball') noballs++;
         if (b.runs === 0 && !b.isWicket && b.extraType === 'none') dotBalls++;
     });

     return { boundaries, sixes, wides, noballs, dotBalls };
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 border-x border-gray-200">
      <header className="px-6 py-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate('/history')} className="p-2 -ml-2 text-gray-400 active:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-0.5">Match Details</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
            {format(match.createdAt, 'MMM d, yyyy • h:mm a')}
          </p>
        </div>
        <button onClick={handleExportImage} className="ml-auto p-2 bg-gray-100 rounded-full text-blue-600 active:scale-[0.98]">
           <Download size={18} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex px-6 border-b border-gray-200 mt-2 gap-4 overflow-x-auto no-scrollbar">
        {(['summary', 'scorecard', 'timeline', 'overs'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all block flex-shrink-0 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
           >
             {tab}
           </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32" ref={scorecardRef}>
        {activeTab === 'summary' && (
          <>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl mb-8 shadow-sm">
               <h2 className="text-xl font-black italic tracking-tighter uppercase text-blue-600 mb-6 font-mono border-b border-gray-200 pb-4">
                 {match.status === 'completed' && match.winner 
                   ? (match.winner === 'Tie' ? 'Match Tied!' : `${match.winner} WON`)
                   : 'Match In Progress'
                 }
               </h2>
               <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-gray-200 pb-6">
                   <div>
                     <p className="font-black italic text-xl uppercase text-gray-900">{match.firstInnings.teamName}</p>
                     <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{getOversText(match.firstInnings.balls)} Overs</p>
                   </div>
                   <p className="text-3xl font-black italic text-gray-900">{match.firstInnings.runs}<span className="text-blue-500">/</span>{match.firstInnings.wickets}</p>
                 </div>
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="font-black italic text-xl uppercase text-gray-600">{match.secondInnings.teamName}</p>
                     <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{getOversText(match.secondInnings.balls)} Overs</p>
                   </div>
                   <p className="text-3xl font-black italic text-gray-600">{match.secondInnings.runs}<span className="text-blue-400">/</span>{match.secondInnings.wickets}</p>
                 </div>
               </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl shadow-sm relative">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6">Run Rate Comparison</h3>
              <div className="h-64 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()}>
                    <XAxis dataKey="over" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }} 
                      itemStyle={{ fontWeight: 'black', fontStyle: 'italic' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Line type="stepAfter" dataKey="i1" name={match.firstInnings.teamName} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    {match.secondInnings.balls.length > 0 && (
                      <Line type="stepAfter" dataKey="i2" name={match.secondInnings.teamName} stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {(activeTab === 'scorecard' || activeTab === 'timeline' || activeTab === 'overs') && (
          <div className="flex gap-4 mb-6">
             <button onClick={() => setActiveInning(1)} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase italic tracking-tighter transition-all ${activeInning === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>{match.firstInnings.teamName}</button>
             <button onClick={() => setActiveInning(2)} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase italic tracking-tighter transition-all ${activeInning === 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>{match.secondInnings.teamName}</button>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Ball by Ball</h3>
            {renderTimeline(currentInningData)}
          </div>
        )}

        {activeTab === 'scorecard' && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6">
               <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Total</p>
               <h2 className="text-5xl font-black italic tracking-tighter text-gray-900">{currentInningData.runs}<span className="text-blue-500 text-4xl">/</span>{currentInningData.wickets}</h2>
               <div className="flex gap-4 mt-4 py-4 border-y border-gray-200">
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Overs</p>
                   <p className="font-mono font-bold text-sm">{getOversText(currentInningData.balls)}</p>
                 </div>
                 <div className="w-px bg-gray-200" />
                 <div>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Run Rate</p>
                   <p className="font-mono font-bold text-sm">{getRunRate(currentInningData.runs, currentInningData.balls)}</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-4">
                 {(() => {
                    const s = getInningsStats(currentInningData);
                    return (
                      <>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Boundaries (4s/6s)</p>
                           <p className="font-black italic text-lg">{s.boundaries} / {s.sixes}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Dot Balls</p>
                           <p className="font-black italic text-lg">{s.dotBalls}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Wides</p>
                           <p className="font-black italic text-lg">{s.wides}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">No Balls</p>
                           <p className="font-black italic text-lg">{s.noballs}</p>
                        </div>
                      </>
                    )
                 })()}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'overs' && (
          <div className="space-y-4">
            {Object.keys(groupedOvers).length === 0 ? (
               <p className="text-gray-400 text-sm font-bold uppercase tracking-widest text-center py-4">No overs completed</p>
            ) : (
              (Object.entries(groupedOvers) as Array<[string, { balls: typeof match.firstInnings.balls, runs: number }]>)
                .reverse()
                .map(([overIndex, overData]) => {
                const overNum = parseInt(overIndex) + 1;
                return (
                  <div key={overIndex} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                     <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                       <h4 className="font-black uppercase tracking-widest text-sm text-gray-900">Over {overNum}</h4>
                       <span className="font-bold text-blue-600 text-xs uppercase tracking-widest">{overData.runs} Runs</span>
                     </div>
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {overData.balls.map((b, i) => {
                          let display = b.runs.toString();
                          let style = "bg-white text-gray-700 border-gray-200";
                          if (b.isWicket) {
                            display = "W";
                            style = "bg-red-50 text-red-600 border-red-200";
                          } else if (b.extraType === 'wide') {
                            display = b.runs > 1 ? `${b.runs}WD` : "WD";
                            style = "bg-gray-100 text-gray-600 border-gray-300";
                          } else if (b.extraType === 'noball') {
                            display = b.runs > 1 ? `${b.runs}NB` : "NB";
                            style = "bg-gray-100 text-gray-600 border-gray-300";
                          } else if (b.runs === 4 || b.runs === 6) {
                            style = "bg-blue-50 text-blue-600 border-blue-200";
                          }
                          return (
                            <div key={i} className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shadow-sm ${style}`}>
                              {display}
                            </div>
                          )
                        })}
                     </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
