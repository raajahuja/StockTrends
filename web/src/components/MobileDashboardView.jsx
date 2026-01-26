import React, { useState } from 'react';
import { IndexPerformanceCard } from './IndexPerformanceCard';

/**
 * MobileDashboardView
 * Main mobile layout featuring "Multi-Day", "Multi-Quarter" toggles 
 * and a list of expandable performance cards.
 */
export function MobileDashboardView({ groupedData, groupedDates, onStockClick, getChangeColor }) {
    const [activeView, setActiveView] = useState('Multi-Day'); // 'Multi-Day', 'Multi-Quarter', 'Multi-Year'

    // For 'Multi-Day', we just show the daily dates passed in groupedDates.
    // Ideally, if 'Multi-Quarter' is selected, we'd need aggregated data (not available in this context yet without calculating it).
    // For now, we will simulate the functionality or just show the daily dates as a placeholder for the structure.

    // Limit history for performance? Default 7 days visible in scroll
    const displayDates = groupedDates;

    return (
        <div className="flex flex-col h-full bg-[#131110] text-white">

            {/* HEADER */}
            <div className="p-4 pt-6 flex justify-between items-center bg-[#1c1917] border-b border-white/5 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold text-xl">₹</div>
                    <h1 className="text-xl font-bold tracking-tight">Nifty Indices</h1>
                </div>
                <div className="flex gap-4 text-stone-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="p-4 bg-[#1c1917]/50 backdrop-blur-md sticky top-[73px] z-10 border-b border-white/5 space-y-4">

                {/* Period Selector */}
                <div className="flex justify-between items-center">
                    <div className="bg-[#262626] border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-bold text-white">Last 7 Days</span>
                        <span className="text-[10px] text-stone-500">▼</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 rounded bg-[#262626] border border-white/10 flex items-center justify-center text-stone-400">◀</button>
                        <button className="w-8 h-8 rounded bg-[#262626] border border-white/10 flex items-center justify-center text-stone-400">▶</button>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {['Multi-Day', 'Multi-Quarter', 'Multi-Year'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveView(mode)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeView === mode ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-transparent text-stone-400 border-white/10'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                {/* Overall Market Widget (Mocked based on screenshot) */}
                <div className="bg-[#1c1917] border border-white/5 rounded-2xl p-4 flex justify-around items-center">
                    <div className="text-center">
                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Period</div>
                        <div className="text-xl font-bold text-[#ff4d7d]">-3.24%</div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    <div className="text-center">
                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">High</div>
                        <div className="text-xl font-bold text-white">25,420</div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    <div className="text-center">
                        <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">Low</div>
                        <div className="text-xl font-bold text-white">24,680</div>
                    </div>
                </div>

                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest pl-1 border-l-2 border-emerald-500 ml-1">
                    Nifty Indices
                </div>

                {groupedData.map(item => (
                    <IndexPerformanceCard
                        key={item.symbol}
                        item={item}
                        historyDates={displayDates}
                        onSelect={onStockClick}
                        getChangeColor={getChangeColor}
                    />
                ))}

                <div className="h-20"></div> {/* Bottom padding */}
            </div>

        </div>
    );
}
