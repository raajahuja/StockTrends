import React, { useState, useEffect, useRef } from 'react';

/**
 * MobileTimeTravelView
 * A native-app style view for mobile devies that replaces the complex grid
 * with a tactile "Time Travel" slider.
 */
export function MobileTimeTravelView({ groupedData, groupedDates, onStockClick, getChangeColor }) {
    // Dates are usually passed newest first (index 0 is today)
    // We want the slider to feel chronological left-to-right (Oldest -> Newest)
    // So we reverse the dates for the slider, but keep index mapping correct.

    // Ensure we have dates to work with
    if (!groupedDates || groupedDates.length === 0) {
        return <div className="h-full flex items-center justify-center text-stone-500">No data available</div>;
    }

    const [sliderIndex, setSliderIndex] = useState(groupedDates.length - 1); // Default to newest (last in reversed array)
    // Create a reversed copy for the chronological slider
    const sliderDates = [...groupedDates].reverse();

    const selectedDate = sliderDates[sliderIndex];

    // Haptic feedback simulation (visual mostly)
    const [isSliding, setIsSliding] = useState(false);

    const handleSliderChange = (e) => {
        setSliderIndex(parseInt(e.target.value));
        setIsSliding(true);

        // Light vibration if available
        if (navigator.vibrate) navigator.vibrate(5);
    };

    const handleSliderEnd = () => {
        setIsSliding(false);
    };

    const currentData = groupedData.map(item => {
        const val = item.history[selectedDate];
        return {
            symbol: item.symbol,
            name: item.name || '',
            value: val,
            hasData: val !== undefined && val !== null,
            historyDetails: item.historyDetails,
            fullItem: item
        };
    }); // Show all items regardless of data presence to maintain list stability

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d)) return dateStr;
            // "24 JAN, FRI"
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' }).toUpperCase();
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1c1917] text-white relative overflow-hidden">

            {/* HEADER: Dynamic Date Display */}
            <div className="flex-none p-6 pt-8 bg-gradient-to-b from-stone-900/80 to-transparent z-10 transition-colors duration-300">
                <div className="text-xs font-bold text-stone-500 tracking-[0.2em] uppercase mb-1 flex justify-between">
                    <span>Market Status</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-stone-400 border border-white/5">
                        {sliderIndex + 1} / {sliderDates.length}
                    </span>
                </div>
                <div className={`text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight transition-all duration-200 ${isSliding ? 'text-emerald-400 transform scale-105' : 'text-white'}`}>
                    {formatDate(selectedDate)}
                </div>
                <div className="text-sm text-stone-400 font-medium mt-1">
                    {groupedData.length} Indices Tracked
                </div>
            </div>

            {/* LIST: Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-48 custom-scrollbar mask-linear-fade-bottom">
                <div className="space-y-3">
                    {currentData.map((item) => {
                        const val = item.value;
                        const hasData = item.hasData;

                        return (
                            <div
                                key={item.symbol}
                                onClick={() => onStockClick(item.fullItem)}
                                className="bg-[#292524] rounded-2xl p-4 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all duration-200 active:bg-white/10 shadow-sm"
                            >
                                <div>
                                    <div className="text-lg font-bold text-white tracking-tight">{item.symbol}</div>
                                    <div className="text-[10px] text-stone-500 font-medium tracking-wide uppercase mt-0.5 truncate max-w-[150px]">
                                        {item.name || 'INDEX'}
                                    </div>
                                </div>

                                <div className="text-right">
                                    {hasData ? (
                                        <div className={`text-xl font-mono font-bold tracking-tight ${getChangeColor(val)}`}>
                                            {val > 0 ? '+' : ''}{val.toFixed(2)}%
                                        </div>
                                    ) : (
                                        <div className="text-stone-600 font-mono text-sm opacity-50">-</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER: Time Slider Control */}
            <div className="flex-none absolute bottom-0 left-0 right-0 p-6 pb-20 bg-[#161413]/95 backdrop-blur-xl border-t border-white/10 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

                {/* Slider Visuals */}
                <div className="relative h-14 flex items-center justify-center mb-1">

                    {/* Track Lines */}
                    <div className="absolute inset-x-0 h-10 flex justify-between items-end px-2 pointer-events-none opacity-40">
                        {sliderDates.map((_, i) => {
                            // Show fewer tick marks if many dates
                            const showTick = sliderDates.length < 20 || i % Math.ceil(sliderDates.length / 20) === 0;
                            if (!showTick) return null;

                            const isSelected = i === sliderIndex;
                            const isNear = Math.abs(i - sliderIndex) < 2;

                            return (
                                <div
                                    key={i}
                                    className={`w-[2px] rounded-full transition-all duration-200 bg-white ${isSelected ? 'h-5 bg-emerald-500 opacity-100' : isNear ? 'h-3 opacity-60' : 'h-1.5 opacity-30'}`}
                                />
                            );
                        })}
                    </div>

                    {/* Actual Range Input */}
                    <input
                        type="range"
                        min="0"
                        max={sliderDates.length - 1}
                        step="1"
                        value={sliderIndex}
                        onChange={handleSliderChange}
                        onTouchEnd={handleSliderEnd}
                        onMouseUp={handleSliderEnd}
                        className="w-full absolute z-30 opacity-0 h-14 cursor-pointer"
                    />

                    {/* Custom Thumb / Indicator */}
                    <div
                        className="absolute h-10 w-1 rounded-full pointer-events-none transition-all duration-75 ease-out flex flex-col items-center justify-center"
                        style={{
                            left: `${(sliderIndex / (sliderDates.length - 1)) * 100}%`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        {/* Glow Effect */}
                        <div className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse"></div>
                        {/* Thumb Knob */}
                        <div className="w-6 h-6 border-[3px] border-emerald-500 rounded-full bg-[#1c1917] shadow-[0_0_10px_rgba(16,185,129,0.5)] z-40 relative"></div>
                    </div>

                </div>

                {/* Labels below slider */}
                <div className="flex justify-between text-[10px] uppercase font-bold text-stone-500 tracking-widest mt-2 px-1">
                    <span>{formatDate(sliderDates[0])}</span>
                    <span className={`transition-colors ${isSliding ? 'text-emerald-500' : ''}`}>Time Travel</span>
                    <span>{formatDate(sliderDates[sliderDates.length - 1])}</span>
                </div>

            </div>
        </div>
    );
}
