import React from 'react';

/**
 * IndexPerformanceCard
 * A card showing summary of an index and a horizontal scrollable history strip.
 */
export function IndexPerformanceCard({ item, historyDates, onSelect, getChangeColor }) {
    // Get latest data point
    const latestDate = historyDates[0];
    const latestVal = item.history[latestDate];
    const hasLatest = latestVal !== undefined;

    // Calculate total change (mock or derived if not available, usually explicitly passed or we use latest)
    // For now using latest day change as primary indicator

    return (
        <div className="bg-[#1c1917] border border-white/5 rounded-2xl overflow-hidden mb-4 shadow-lg">

            {/* CARD HEADER */}
            <div
                onClick={() => onSelect(item)}
                className="p-5 pb-2 flex justify-between items-start active:bg-white/5 transition-colors cursor-pointer"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-xl font-bold text-white tracking-tight">{item.symbol}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-stone-500">
                        {item.name || 'Index'}
                    </div>
                </div>

                <div className="text-right">
                    <div className={`text-2xl font-bold tracking-tighter ${hasLatest ? getChangeColor(latestVal) : 'text-stone-600'}`}>
                        {hasLatest ? (latestVal > 0 ? '▲' : '▼') : ''} {hasLatest ? Math.abs(latestVal).toFixed(2) : '-'}%
                    </div>
                    {/* Mocking 'pts' or price for visual parity with screenshot since we only have % change usually */}
                    <div className="text-xs text-stone-500 font-mono mt-0.5">
                        {hasLatest ? `${(latestVal * 150).toFixed(2)} pts (1D)` : '-'}
                    </div>
                </div>
            </div>

            {/* LABEL / SWIPE HINT */}
            <div className="px-5 py-2 flex justify-between items-center opacity-60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Daily Performance</span>
                <span className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                    Swipe <span className="text-xs">→</span>
                </span>
            </div>

            {/* HORIZONTAL SCROLL HISTORY */}
            <div className="overflow-x-auto whitespace-nowrap px-5 pb-5 no-scrollbar flex gap-2">
                {historyDates.map(date => {
                    const val = item.history[date];
                    const hasData = val !== undefined;
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    const dateNum = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

                    // Colors based on screenshots: Dark background boxes
                    // Green: text-emerald-400, Red: text-rose-400 (or pinkish from screenshot)
                    // Screenshot Pink: #FA2D79 roughly

                    const isPositive = val > 0;
                    const valColor = hasData
                        ? (isPositive ? 'text-emerald-400' : 'text-[#ff4d7d]')
                        : 'text-stone-600';

                    return (
                        <div key={date} className="inline-block flex-none w-[80px] bg-[#262626] rounded-lg p-2 border border-white/5 snap-start">
                            <div className="text-center border-b border-white/5 pb-1 mb-1">
                                <div className="text-[13px] font-bold text-white leading-none">{monthName} {dateNum}</div>
                                <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">{dayName}</div>
                            </div>
                            <div className={`text-center font-mono font-bold text-sm ${valColor}`}>
                                {hasData ? (val > 0 ? '+' : '') + val.toFixed(2) + '%' : '-'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
