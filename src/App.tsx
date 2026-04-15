import React, { useState, useEffect, useMemo } from 'react';
import { Droplet, CalendarDays, Activity, GlassWater, Trash2, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type WaterEntry = {
  id: string;
  date: string; // yyyy-MM-dd
  cups: number;
  volume: number;
  timestamp: number;
};

type DailySummary = {
  dateObj: Date;
  displayDate: string;
  totalCups: number;
  totalVolume: number;
};

// Generate initial mock data for the past 5 days so the history isn't empty
const generateMockHistory = (): WaterEntry[] => {
  const mock: WaterEntry[] = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const pastDate = subDays(today, i);
    const dateStr = format(pastDate, 'yyyy-MM-dd');
    // Generate around 8-11 cups per day to get closer to 2800cc
    const cups = Math.floor(Math.random() * 4) + 8; 
    for(let j=0; j<cups; j++) {
       mock.push({
         id: `mock-${i}-${j}`,
         date: dateStr,
         cups: 1,
         volume: 250,
         timestamp: pastDate.setHours(8 + j * 1.5, 30, 0, 0) // Mock times throughout the day
       });
    }
  }
  return mock;
};

export default function App() {
  // Bubbles Animation Data
  const bubbles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 6 + 4,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      xOffset1: Math.random() * 15 - 7.5,
      xOffset2: Math.random() * 15 - 7.5,
    }));
  }, []);

  // State
  const [entries, setEntries] = useState<WaterEntry[]>(() => {
    const saved = localStorage.getItem('water-tracker-entries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return generateMockHistory();
      }
    }
    return generateMockHistory();
  });

  // Use empty string state to allow easy typing, but fallback to defaults on submit
  const [inputVolume, setInputVolume] = useState<string>('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('water-tracker-entries', JSON.stringify(entries));
  }, [entries]);

  // Derived Data
  const todayDate = new Date();
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  
  const todayEntries = entries
    .filter(e => e.date === todayStr)
    .sort((a, b) => a.timestamp - b.timestamp);

  const todayTotalCups = todayEntries.reduce((sum, e) => sum + e.cups, 0);
  const todayTotalVolume = todayEntries.reduce((sum, e) => sum + e.volume, 0);

  // Calculate history for the past 5 days
  const history: DailySummary[] = [];
  for (let i = 1; i <= 5; i++) {
    const targetDate = subDays(todayDate, i);
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.date === targetDateStr);
    
    history.push({
      dateObj: targetDate,
      displayDate: format(targetDate, 'M/dd'),
      totalCups: dayEntries.reduce((sum, e) => sum + e.cups, 0),
      totalVolume: dayEntries.reduce((sum, e) => sum + e.volume, 0),
    });
  }

  // Handlers
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fallback to 250cc if left empty
    const volume = inputVolume === '' ? 250 : Number(inputVolume);
    
    if (volume <= 0 || isNaN(volume)) return;

    const newEntry: WaterEntry = {
      id: crypto.randomUUID(),
      date: todayStr,
      cups: 1, // Each entry counts as 1 cup
      volume,
      timestamp: Date.now(),
    };

    setEntries(prev => [...prev, newEntry]);
    
    // Reset to empty so placeholder shows again
    setInputVolume('');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  // Visuals
  const dailyGoal = 2800; // Updated to 2800cc goal
  const progressPercent = Math.min((todayTotalVolume / dailyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000033] to-[#003399] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-black/50 w-full max-w-6xl overflow-hidden border border-white/10 flex flex-col lg:flex-row">
        
        {/* Left Column: Main Content (Input & List) */}
        <div className="flex-1 flex flex-col">
          {/* Header Section */}
          <div className="bg-black/20 p-6 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col sm:flex-row items-center sm:justify-between gap-6 border-b border-white/10">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 flex items-center gap-4 sm:gap-5"
            >
              <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-3 sm:p-4 rounded-2xl shadow-lg shadow-cyan-500/20 shrink-0">
                <Droplet className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white/20" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1 whitespace-nowrap truncate">每日喝水量表</h1>
                <p className="text-cyan-300 font-bold tracking-widest text-xs sm:text-sm uppercase">
                  Daily Water Tracker
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative z-10 bg-black/30 px-6 py-3 rounded-2xl border border-white/10 text-center shadow-inner shrink-0"
            >
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Today</div>
              <div className="text-xl font-black text-white tracking-wider">
                {format(todayDate, 'yyyy.MM.dd')}
              </div>
            </motion.div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col">
            {/* Today's Record Header */}
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">今日喝水紀錄</h2>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddEntry} className="mb-8 bg-black/20 p-4 sm:p-6 rounded-3xl border border-white/10">
              <div className="flex flex-row items-end gap-3 sm:gap-4 w-full">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CC數 Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={inputVolume}
                    onChange={(e) => setInputVolume(e.target.value)}
                    placeholder="250"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 sm:py-3.5 text-white font-medium focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-center sm:text-left shadow-inner placeholder:text-white/20"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl px-5 sm:px-8 py-3 sm:py-3.5 font-bold tracking-wide transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10 shrink-0 h-[48px] sm:h-[52px]"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">新增紀錄</span>
                  <span className="sm:hidden">新增</span>
                </button>
              </div>
            </form>

            {/* Today's List */}
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-slate-400 mb-3 px-2 sm:px-4 uppercase tracking-wider">
                <div className="w-8 sm:w-10 text-center">#</div>
                <div className="text-center flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5"/> 時間</div>
                <div className="text-center">CC數</div>
                <div className="w-8 sm:w-10 text-center">刪除</div>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                <AnimatePresence initial={false}>
                  {todayEntries.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-sm gap-4"
                    >
                      <div className="bg-black/20 p-5 rounded-full border border-white/5">
                        <GlassWater className="w-10 h-10 opacity-50" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-slate-300 mb-1">今天還沒有喝水紀錄喔！</p>
                        <p className="text-xs opacity-70">趕快喝杯水，並在上方新增紀錄吧</p>
                      </div>
                    </motion.div>
                  ) : (
                    todayEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 sm:gap-4 items-center bg-black/20 rounded-2xl p-3 sm:p-4 border border-white/5 hover:bg-black/40 transition-colors group"
                      >
                        <div className="w-8 sm:w-10 flex justify-center">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 text-cyan-400 flex items-center justify-center text-xs sm:text-sm font-bold border border-white/10">
                            {index + 1}
                          </div>
                        </div>
                        <div className="text-center font-medium text-slate-300 bg-black/30 py-1.5 rounded-lg text-sm border border-white/5">
                          {format(entry.timestamp, 'HH:mm')}
                        </div>
                        <div className="text-center font-bold text-white text-sm sm:text-base">{entry.volume}</div>
                        <div className="w-8 sm:w-10 flex justify-center">
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/20 p-2 rounded-xl transition-colors"
                            title="刪除紀錄"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & History */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-black/20 p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col gap-8">
          
          {/* Today's Total (Water Fill Effect) */}
          <div>
            <h3 className="text-xl font-bold text-white mb-5">今日進度</h3>
            <div 
              className="relative overflow-hidden rounded-[2.5rem] bg-black/40 border border-white/10 shadow-2xl h-[260px] flex flex-col justify-center"
            >
              {/* Water fill background */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#003399]/80 to-cyan-400/40 transition-all duration-1000 ease-out"
                style={{ height: `${Math.max(progressPercent, 5)}%` }}
              >
                {/* Wave 1 (Back) */}
                <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none -translate-y-full pointer-events-none">
                  <motion.div 
                    className="flex w-[200%]"
                    animate={{ x: ['-50%', '0%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2 h-5 sm:h-8 text-cyan-400/30 fill-current">
                      <path d="M0,60 C150,60 150,0 300,0 C450,0 450,60 600,60 C750,60 750,0 900,0 C1050,0 1050,60 1200,60 L1200,120 L0,120 Z" />
                    </svg>
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2 h-5 sm:h-8 text-cyan-400/30 fill-current">
                      <path d="M0,60 C150,60 150,0 300,0 C450,0 450,60 600,60 C750,60 750,0 900,0 C1050,0 1050,60 1200,60 L1200,120 L0,120 Z" />
                    </svg>
                  </motion.div>
                </div>

                {/* Wave 2 (Front) */}
                <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none -translate-y-full pointer-events-none">
                  <motion.div 
                    className="flex w-[200%]"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2 h-4 sm:h-6 text-cyan-400/40 fill-current">
                      <path d="M0,60 C150,60 150,0 300,0 C450,0 450,60 600,60 C750,60 750,0 900,0 C1050,0 1050,60 1200,60 L1200,120 L0,120 Z" />
                    </svg>
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-1/2 h-4 sm:h-6 text-cyan-400/40 fill-current">
                      <path d="M0,60 C150,60 150,0 300,0 C450,0 450,60 600,60 C750,60 750,0 900,0 C1050,0 1050,60 1200,60 L1200,120 L0,120 Z" />
                    </svg>
                  </motion.div>
                </div>

                {/* Bubbles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {bubbles.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      className="absolute bottom-0 rounded-full bg-cyan-100/40 shadow-[0_0_8px_rgba(207,250,254,0.6)]"
                      style={{ width: bubble.size, height: bubble.size, left: `${bubble.left}%` }}
                      animate={{
                        y: [0, -260],
                        x: [0, bubble.xOffset1, bubble.xOffset2, 0],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: bubble.duration,
                        repeat: Infinity,
                        delay: bubble.delay,
                        ease: "linear",
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="relative z-10 p-8 flex flex-col items-center text-center gap-2">
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest mb-1">Total Volume</div>
                <div className="flex items-baseline gap-2">
                  <span key={todayTotalVolume} className="text-6xl font-black tracking-tighter text-white drop-shadow-md">
                    {todayTotalVolume}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-300">
                  / {dailyGoal} cc
                </div>
                <div key={todayTotalCups} className="text-sm font-bold mt-4 px-5 py-2 rounded-full bg-black/50 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm shadow-inner">
                  共 {todayTotalCups} 杯
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10"></div>

          {/* History Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-white">前5日喝水紀錄</h3>
            </div>
            
            <div className="space-y-3">
              {history.map((day) => (
                <div 
                  key={day.displayDate} 
                  className={cn(
                    "flex justify-between items-center p-4 rounded-2xl text-sm transition-all",
                    day.totalVolume > 0 
                      ? "bg-black/30 border border-white/10 hover:border-white/20 hover:bg-black/40" 
                      : "bg-transparent border border-white/5 opacity-50"
                  )}
                >
                  <div className="w-20 font-bold text-slate-300">{day.displayDate}</div>
                  <div className="flex-1 text-center font-bold text-slate-400">
                    {day.totalCups > 0 ? `${day.totalCups} 杯` : '-'}
                  </div>
                  <div className="w-24 text-right font-black text-cyan-300">
                    {day.totalVolume > 0 ? `${day.totalVolume} cc` : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

