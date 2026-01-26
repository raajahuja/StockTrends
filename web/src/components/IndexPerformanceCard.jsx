import React from 'react';

/**
 * IndexPerformanceCard
 * A card showing summary of an index and a horizontal scrollable history strip.
 */
export function IndexPerformanceCard({ item, historyDates, onSelect, getChangeColor }) {
    // Defensive check
    if (!historyDates || historyDates.length === 0) {
        return (
            <div className="bg-[#1c1917] border border-white/5 rounded-2xl p-6 text-center text-stone-600 italic text-sm mb-4">
                No performance data available
            </div>
        );
    }

    // Get latest data point
    const latest = historyDates[0];
    const isLatestObj = typeof latest === 'object';
    const latestVal = isLatestObj ? latest.value : item.history[latest];
    const hasLatest = latestVal !== undefined && latestVal !== null;

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
                    <div className="text-xs text-stone-500 font-mono mt-0.5">
                        {hasLatest ? `${(latestVal * 150).toFixed(2)} pts (1D)` : '-'}
                    </div>
                </div>
            </div>

            {/* LABEL / SWIPE HINT */}
            <div className="px-5 py-2 flex justify-between items-center opacity-60">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Performance History</span>
                <span className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                    Swipe <span className="text-xs">→</span>
                </span>
            </div>

            {/* HORIZONTAL SCROLL HISTORY */}
            <div className="overflow-x-auto whitespace-nowrap px-5 pb-5 no-scrollbar flex gap-2">
                {historyDates.map((point, idx) => {
                    const isObj = typeof point === 'object';
                    const val = isObj ? point.value : item.history[point];
                    const hasData = val !== undefined && val !== null;

                    let label = '';
                    let subLabel = '';

                    if (isObj) {
                        label = point.label;
                        subLabel = point.subLabel;
                    } else {
                        const dateObj = new Date(point);
                        label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
                        subLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    }

                    const isPositive = val > 0;
                    const valColor = hasData
                        ? (isPositive ? 'text-emerald-400' : 'text-[#ff4d7d]')
                        : 'text-stone-600';

                    return (
                        <div key={isObj ? `${point.label}-${point.subLabel}` : point} className="inline-block flex-none w-[85px] bg-[#262626] rounded-lg p-2 border border-white/5 snap-start">
                            <div className="text-center border-b border-white/5 pb-1 mb-1">
                                <div className="text-[12px] font-bold text-white leading-none truncate">{label}</div>
                                <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">{subLabel}</div>
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
