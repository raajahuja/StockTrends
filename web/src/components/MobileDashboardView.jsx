import React, { useState, useMemo } from 'react';
import { IndexPerformanceCard } from './IndexPerformanceCard';

/**
 * MobileDashboardView
 * Main mobile layout featuring "Daily", "Quarterly", "Yearly" toggles 
 * with real data aggregation.
 */
export function MobileDashboardView({ groupedData, groupedDates, onStockClick, getChangeColor }) {
    const [activeView, setActiveView] = useState('Daily'); // 'Daily', 'Quarterly', 'Yearly'
    const [search, setSearch] = useState('');

    // -- Aggregation Helpers --

    // Daily: Just map dates to { label: '24 Jan', subLabel: 'Fri', value: ... }
    const getDailyPoints = (item) => {
        return groupedDates.slice(0, 10).map(date => { // Limit to 10 days for performance/relevance
            const d = new Date(date);
            return {
                label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                subLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
                value: item.history[date]
            };
        });
    };

    // Quarterly: Aggregate data by Quarter (Q1 2024, Q4 2023...)
    // Since we only have "Daily Change %" in history, we can't sum them directly to get accurate quarterly change 
    // without the underlying price. 
    // APPROXIMATION: We will sum the daily linear changes. This is mathematically incorrect for compound returns 
    // (1.1 * 1.1 != 1.2), but for small percentages it's a rough proxy. 
    // BETTER: If `item` has `historyDetails` with price, use that. 
    // Assuming we only have `item.history` (map of date->change%), we will display the SUM of changes for that period 
    // as a "Trend Score" or "Cumulative Change".

    const getAggregatedPoints = (item, periodType) => {
        const buckets = {};
        const sortedDates = [...groupedDates].reverse(); // Oldest first for calculation

        sortedDates.forEach(date => {
            const val = item.history[date];
            if (val === undefined || val === null) return;

            const d = new Date(date);
            let key = '';
            let label = '';
            let subLabel = '';

            if (periodType === 'Quarterly') {
                const q = Math.floor(d.getMonth() / 3) + 1;
                const y = d.getFullYear();
                key = `${y}-Q${q}`;
                label = `Q${q}`;
                subLabel = `${y}`;
            } else if (periodType === 'Yearly') {
                key = `${d.getFullYear()}`;
                label = `${d.getFullYear()}`;
                subLabel = 'YTD';
            }

            if (!buckets[key]) buckets[key] = { label, subLabel, value: 0, count: 0 };
            // Simple additive approximation. 
            // Real formula: (1 + r1/100) * (1 + r2/100) ... - 1
            // Let's try to do compound if possible, otherwise additive.
            // val is percent, e.g. 1.2
            // NewValue = OldValue * (1 + val/100)
            // We initialize bucket at 1.0 (base)
            if (buckets[key].count === 0) buckets[key].compound = 1.0;

            buckets[key].compound = buckets[key].compound * (1 + val / 100);
            buckets[key].count++;
        });

        // Convert buckets to array and reverse to show newest first
        return Object.keys(buckets).reverse().map(key => {
            const b = buckets[key];
            const compoundRet = (b.compound - 1) * 100;
            return {
                label: b.label,
                subLabel: b.subLabel,
                value: compoundRet
            };
        });
    };

    const getDataPoints = (item) => {
        if (activeView === 'Daily') return getDailyPoints(item);
        if (activeView === 'Quarterly') return getAggregatedPoints(item, 'Quarterly');
        if (activeView === 'Yearly') return getAggregatedPoints(item, 'Yearly');
        return [];
    };


    const filteredData = useMemo(() => {
        if (!search) return groupedData;
        return groupedData.filter(item =>
            item.symbol.toLowerCase().includes(search.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [groupedData, search]);


    return (
        <div className="flex flex-col h-full bg-[#131110] text-white">

            {/* HEADER REMOVED as requested. Directly Search Controls. */}

            {/* SEARCH & CONTROLS */}
            <div className="p-4 pt-8 bg-[#1c1917]/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 space-y-4">

                {/* Large Search Bar */}
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search Nifty Indices..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#262626] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 transition-colors font-medium"
                    />
                </div>

                {/* View Toggles (Daily, Quarterly, Yearly) */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2">
                    {['Daily', 'Quarterly', 'Yearly'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setActiveView(mode)}
                            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeView === mode ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#262626] text-stone-400 border-white/5'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                {filteredData.map(item => (
                    <IndexPerformanceCard
                        key={item.symbol}
                        item={item}
                        historyDates={getDataPoints(item)}
                        onSelect={onStockClick}
                        getChangeColor={getChangeColor}
                    />
                ))}

                {filteredData.length === 0 && (
                    <div className="text-center text-stone-600 mt-20 font-medium">
                        No indices found
                    </div>
                )}

                <div className="h-24"></div> {/* Bottom padding */}
            </div>

        </div>
    );
}
