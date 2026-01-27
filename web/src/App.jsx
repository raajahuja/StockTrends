import { useState, useEffect, useMemo, useRef } from 'react'
import './App.css'
// import AdminPanel from './components/AdminPanel'
import { useFeatureFlag } from './contexts/FeatureFlagContext'
import Spinner from './components/Spinner'
import SkeletonLoader from './components/SkeletonLoader'
import { MobileDashboardView } from './components/MobileDashboardView'; // Import the new mobile dashboard
import { isMarketClosed, getISTDateString, MARKET_HOLIDAYS } from './utils/marketHolidays';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api'; // In production (Firebase), this maps to web/public/api folder containing static JSONs

// ===========================
// UTILITY FUNCTIONS (Modern SaaS Pastel Scale)
// ===========================
// 10-Level Semantic Heatmap Scale (Design Review Phase 1)
const getChangeColor = (value) => {
  const v = parseFloat(value) || 0;

  // Green Scale (Gain 1-5)
  if (v > 3.0) return 'bg-[var(--gain-1)] text-white font-bold shadow-md'; // Strongest
  if (v > 2.0) return 'bg-[var(--gain-2)] text-white font-semibold';
  if (v > 1.0) return 'bg-[var(--gain-3)] text-white font-medium';
  if (v > 0.5) return 'bg-[var(--gain-4)] text-emerald-100';
  if (v > 0.0) return 'bg-[var(--gain-5)] text-emerald-200/80'; // Subtlest

  // Red Scale (Loss 1-5)
  if (v < -3.0) return 'bg-[var(--loss-1)] text-white font-bold shadow-md'; // Strongest
  if (v < -2.0) return 'bg-[var(--loss-2)] text-white font-semibold';
  if (v < -1.0) return 'bg-[var(--loss-3)] text-white font-medium';
  if (v < -0.5) return 'bg-[var(--loss-4)] text-rose-100';
  if (v < 0.0) return 'bg-[var(--loss-5)] text-rose-200/80'; // Subtlest

  // Neutral
  return 'bg-transparent text-slate-500 font-normal opacity-40';
};

// Gradient Heatmap Scale for Terminal View
// Gradient Heatmap Scale for Terminal View (Pastel)
// Gradient Heatmap Scale for Terminal View (Pastel)
const getCellBgColor = (value) => {
  const v = parseFloat(value) || 0;

  // Green Scale
  if (v > 2.0) return 'bg-[#22C55E] text-slate-950 font-bold tracking-tight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]';
  if (v > 1.0) return 'bg-[#4ADE80]/40 text-emerald-200 font-medium';
  if (v > 0.5) return 'bg-[#BBF7D0]/10 text-emerald-400 font-normal';

  // Red Scale
  if (v < -2.0) return 'bg-[#F43F5E] text-white font-bold tracking-tight shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]';
  if (v < -1.0) return 'bg-[#FB7185]/40 text-rose-200 font-medium';
  if (v < -0.5) return 'bg-[#FECDD3]/10 text-rose-400 font-normal';

  // Neutral (Transparent)
  return 'bg-transparent text-slate-400 font-normal';
};

const getChangeTextColor = (value) => {
  const v = parseFloat(value) || 0;
  if (v >= 0) return 'text-[#4ADE80]';
  return 'text-[#F43F5E]';
};

const formatMarketCap = (value) => {
  if (!value) return '-';
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L Cr`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K Cr`;
  return `₹${value.toFixed(0)} Cr`;
};

const calculateOpenPrice = (close, changePercent) => {
  const c = parseFloat(close) || 0;
  const p = parseFloat(changePercent) || 0;
  const open = c / (1 + p / 100);
  return open.toFixed(2);
};

// ===========================
// CHART COMPONENTS
// ===========================

function MarketDistributionChart({ stocks }) {
  const data = useMemo(() => {
    const buckets = [
      { label: '<-5%', min: -Infinity, max: -5, count: 0, color: 'bg-red-600' },
      { label: '-5% to -2%', min: -5, max: -2, count: 0, color: 'bg-orange-600' },
      { label: '-2% to 0%', min: -2, max: 0, count: 0, color: 'bg-orange-500/50' },
      { label: '0% to +2%', min: 0, max: 2, count: 0, color: 'bg-emerald-500/50' },
      { label: '+2% to +5%', min: 2, max: 5, count: 0, color: 'bg-emerald-600' },
      { label: '>5%', min: 5, max: Infinity, count: 0, color: 'bg-emerald-500' },
    ];

    let validStocks = 0;
    Object.values(stocks).forEach(stock => {
      let change = stock.change;
      if (typeof change === 'string') change = change.replace('%', '');
      change = parseFloat(change);

      if (isNaN(change)) return;
      validStocks++;

      const bucket = buckets.find(b => change >= b.min && change < b.max);
      if (bucket) bucket.count++;
    });

    const maxCount = Math.max(...buckets.map(b => b.count)) || 1;
    return { buckets, maxCount, validStocks };
  }, [stocks]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-white font-semibold text-sm mb-4 flex justify-between">
        <span>Market Return Distribution</span>
        <span className="text-[10px] text-stone-500 font-normal">{data.validStocks} included</span>
      </h3>

      {data.validStocks === 0 ? (
        <div className="flex-1 flex items-center justify-center text-stone-600 text-xs">No return data available</div>
      ) : (
        <div className="flex-1 flex items-end gap-2 px-2 pb-2">
          {data.buckets.map((b, i) => {
            const heightPct = (b.count / data.maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 hover:brightness-110 ${b.color} relative border-t border-x border-white/5`}
                  style={{ height: `${Math.max(1, heightPct)}%` }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 z-20 pointer-events-none shadow-lg">
                    {b.count} ({((b.count / data.validStocks) * 100).toFixed(1)}%)
                  </div>
                </div>
                <div className="text-[9px] text-stone-500 mt-2 text-center leading-tight whitespace-nowrap">{b.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarketScatterChart({ stocks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const points = Object.values(stocks).map(s => ({
      x: Math.log10(s.marketCap || 1),
      y: parseFloat(s.change) || 0,
      color: parseFloat(s.change) >= 0 ? '#10b981' : '#f97316'
    })).filter(p => p.x > 0);

    if (points.length === 0) return;

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(-10, ...points.map(p => p.y));
    const maxY = Math.max(10, ...points.map(p => p.y));

    const scaleX = (val) => ((val - minX) / (maxX - minX)) * (width - 40) + 20;
    const scaleY = (val) => height - (((val - minY) / (maxY - minY)) * (height - 40) + 20);

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const zeroY = scaleY(0);
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.strokeStyle = '#555';
    ctx.stroke();

    points.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(scaleX(p.x), scaleY(p.y), 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [stocks]);

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex-1 relative w-full h-full min-h-[200px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}

function MarketTreemap({ stocks, categories }) {
  const sectors = useMemo(() => {
    return Object.values(categories).map(cat => {
      const sectorStocks = cat.stocks.map(s => stocks[s]).filter(Boolean);
      const marketCap = sectorStocks.reduce((sum, s) => sum + (s.marketCap || 0), 0);
      const avgChange = sectorStocks.reduce((sum, s) => sum + (parseFloat(s.change) || 0), 0) / (sectorStocks.length || 1);
      return { name: cat.name.replace(/^[^\w]+/, ''), marketCap, avgChange, count: sectorStocks.length };
    })
      .sort((a, b) => b.marketCap - a.marketCap);
    // Removed slice(0, 16) to show ALL sectors
  }, [stocks, categories]);

  const totalCap = sectors.reduce((sum, s) => sum + s.marketCap, 0);

  return (
    <div className="h-full flex flex-col w-full overflow-hidden">
      <div className="flex-1 flex flex-wrap content-start overflow-y-auto custom-scrollbar">
        {sectors.map((s, i) => {
          // Use Math.sqrt for area calculation to prevent tiny sectors from vanishing? 
          // Actually basic treemap logic is Area ~ MarketCap.
          // Since we have 150+ items, we need a minimum size for visibility.
          const widthPct = (s.marketCap / totalCap) * 100;

          return (
            <div
              key={i}
              className={`grow border border-stone-900/50 relative group overflow-hidden ${s.avgChange >= 3 ? 'bg-emerald-600' :
                s.avgChange >= 1 ? 'bg-emerald-500' :
                  s.avgChange >= 0 ? 'bg-emerald-500/60' :
                    s.avgChange > -1 ? 'bg-orange-500/40' :
                      s.avgChange > -3 ? 'bg-orange-600/80' : 'bg-red-700'
                }`}
              style={{
                // Ensure small sectors have at least some width to be clickable/visible
                // But not too large to break proportions totally.
                // flex-basis is key here.
                flexBasis: `${Math.max(2, widthPct)}%`,
                height: widthPct > 5 ? '50%' : widthPct > 2 ? '25%' : '12.5%',
                minHeight: '40px'
              }}
              title={`${s.name}\nCap: ₹${(s.marketCap / 1000).toFixed(0)}K Cr\nChange: ${s.avgChange.toFixed(2)}%`}
            >
              <div className="absolute inset-0 p-1 flex flex-col justify-between transition-opacity hover:opacity-100 opacity-90">
                <span className="text-[9px] font-bold text-white/90 uppercase truncate leading-none">{s.name}</span>
                {widthPct > 1 && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-white block">{s.avgChange > 0 ? '+' : ''}{s.avgChange.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

// ===========================
// NEW ANALYTICS COMPONENTS
// ===========================

function SentimentGauge({ marketStats }) {
  const { gainers, decliners } = marketStats;
  const total = gainers + decliners || 1;
  const ratio = (gainers / total) * 100;

  // Needle rotation: 0 to 180 degrees.
  const rotation = (ratio / 100) * 180;

  let label = "Neutral";
  let color = "text-stone-400";
  if (ratio > 80) { label = "Extreme Greed"; color = "text-emerald-400"; }
  else if (ratio > 60) { label = "Greed"; color = "text-emerald-500"; }
  else if (ratio < 20) { label = "Extreme Fear"; color = "text-red-500"; }
  else if (ratio < 40) { label = "Fear"; color = "text-orange-500"; }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-40 h-20 overflow-hidden mb-2">
        <div className="absolute top-0 left-0 w-full h-full bg-stone-800 rounded-t-full"></div>
        <div className="absolute top-0 left-0 w-full h-full rounded-t-full bg-gradient-to-r from-red-600 via-orange-500 to-emerald-500 opacity-20"></div>
        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-full bg-white origin-bottom transition-all duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation - 90}deg)` }}
        ></div>
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 translate-y-1/2 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
      </div>
      <div className={`text-sm font-bold tracking-wider uppercase ${color} drop-shadow-md`}>{label}</div>
      <div className="text-[10px] text-stone-500 font-mono mt-1">{ratio.toFixed(1)}% Bullish</div>
    </div>
  );
}

function CapTierWidget({ stocks }) {
  const tiers = useMemo(() => {
    const buckets = {
      'Large Cap': { min: 50000, sumChange: 0, count: 0, color: 'emerald' },
      'Mid Cap': { min: 15000, max: 50000, sumChange: 0, count: 0, color: 'blue' },
      'Small Cap': { max: 15000, sumChange: 0, count: 0, color: 'amber' }
    };

    Object.values(stocks).forEach(s => {
      const cap = s.marketCap || 0;
      const change = parseFloat(s.change) || 0;

      if (cap >= 50000) {
        buckets['Large Cap'].sumChange += change;
        buckets['Large Cap'].count++;
      } else if (cap >= 15000) {
        buckets['Mid Cap'].sumChange += change;
        buckets['Mid Cap'].count++;
      } else {
        buckets['Small Cap'].sumChange += change;
        buckets['Small Cap'].count++;
      }
    });

    return Object.entries(buckets).map(([name, data]) => ({
      name,
      avgChange: data.count ? data.sumChange / data.count : 0,
      count: data.count
    }));
  }, [stocks]);

  return (
    <div className="flex gap-2 w-full">
      {tiers.map((t) => (
        <div key={t.name} className="flex-1 bg-white/5 rounded-lg p-3 flex flex-col items-center border border-white/5 shadow-sm hover:bg-white/10 transition-colors">
          <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider mb-1">{t.name}</span>
          <span className={`text-lg font-mono font-medium leading-none ${t.avgChange >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {t.avgChange > 0 ? '+' : ''}{t.avgChange.toFixed(2)}%
          </span>
          <span className="text-[9px] text-stone-600 font-mono mt-1">{t.count}</span>
        </div>
      ))}
    </div>
  );
}

function MarketPropulsionChart({ sectors }) {
  // Sector contribution = (SectorCap / TotalCap) * SectorReturn
  const data = useMemo(() => {
    const totalCap = sectors.reduce((sum, s) => sum + (s.marketCap || 0), 0) || 1;
    return sectors.map(s => {
      const cap = s.marketCap || 0;
      const weight = cap / totalCap;
      const avgChange = isFinite(s.avgChange) ? s.avgChange : 0;
      const contribution = weight * avgChange;
      return { ...s, contribution: isFinite(contribution) ? contribution : 0 };
    }).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 8);
  }, [sectors]);

  const maxVal = Math.max(...data.map(d => Math.abs(d.contribution))) || 0.001;

  return (
    <div className="flex flex-col gap-2 h-full justify-center p-2">
      {data.map(s => {
        const widthPct = (Math.abs(s.contribution) / maxVal) * 100;
        const isPos = s.contribution >= 0;
        return (
          <div key={s.name} className="flex items-center text-xs group hover:bg-white/5 p-0.5 rounded">
            <div className="w-28 text-stone-400 font-medium truncate text-right pr-2 text-[10px]">{s.name}</div>
            <div className="flex-1 h-3 bg-white/5 rounded relative mx-1">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10"></div>
              {isPos ? (
                <div className="absolute left-1/2 top-0 bottom-0 bg-emerald-500/80 rounded-r shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${widthPct * 0.5}%` }}></div>
              ) : (
                <div className="absolute right-1/2 top-0 bottom-0 bg-orange-600/80 rounded-l shadow-[0_0_8px_rgba(249,115,22,0.3)]" style={{ width: `${widthPct * 0.5}%` }}></div>
              )}
            </div>
            <div className={`w-10 text-right font-mono text-[9px] ${isPos ? 'text-emerald-500' : 'text-orange-500'}`}>
              {isPos ? '+' : ''}{s.contribution.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  );
}

function SectorBubbleChart({ sectors }) {
  // Sort by Cap DESC for layout
  const sorted = useMemo(() => [...sectors].sort((a, b) => b.marketCap - a.marketCap), [sectors]);
  const maxCap = sorted[0]?.marketCap || 1;

  return (
    <div className="w-full h-full flex flex-wrap content-center justify-center p-4 gap-3 overflow-y-auto custom-scrollbar">
      {sorted.map(s => {
        // Scale size:
        const sizePct = Math.sqrt(s.marketCap || 0) / Math.sqrt(maxCap);
        // Logarithmic scaling might be better?
        const dim = Math.max(45, sizePct * 160);

        const isPos = s.avgChange >= 0;
        const bg = isPos
          ? `radial-gradient(circle at 35% 35%, rgba(16,185,129,0.9), rgba(6,78,59,0.95))`
          : `radial-gradient(circle at 35% 35%, rgba(249,115,22,0.9), rgba(124,45,18,0.95))`;

        const shadow = isPos
          ? '0 4px 20px rgba(16,185,129,0.3), inset 0 0 10px rgba(255,255,255,0.1)'
          : '0 4px 20px rgba(249,115,22,0.3), inset 0 0 10px rgba(255,255,255,0.1)';

        return (
          <div
            key={s.name}
            className="rounded-full flex flex-col items-center justify-center text-center cursor-default transition-all duration-500 hover:scale-110 hover:z-20 border border-white/5 relative group shrink-0"
            style={{
              width: `${dim}px`,
              height: `${dim}px`,
              background: bg,
              boxShadow: shadow
            }}
            title={`${s.name}\n${s.avgChange.toFixed(2)}%`}
          >
            <div className="text-white font-bold leading-tight tracking-tight drop-shadow-md text-[10px] px-2 truncate w-full pointer-events-none">
              {dim > 60 ? s.name : ''}
            </div>
            {dim > 70 && (
              <div className="text-white/90 font-mono text-[10px] font-medium mt-0.5 drop-shadow-sm">
                {isPos ? '+' : ''}{s.avgChange.toFixed(1)}%
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
// ===========================
// MOBILE CARD COMPONENT
// ===========================
function MobileTimelineCard({ item, date, onSelect, getChangeColor }) {
  const val = item.history[date];
  const hasData = val !== undefined;
  const colorClass = hasData ? getChangeColor(val) : 'bg-stone-800 text-stone-500';

  return (
    <div onClick={() => onSelect(item)} className="bg-[#1c1917]/40 border border-white/5 p-4 rounded-xl flex justify-between items-center mb-3 active:scale-95 transition-transform shadow-sm">
      <div className="flex gap-3 items-center">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${hasData && val >= 0 ? 'bg-emerald-500/10 text-emerald-400' : hasData ? 'bg-rose-500/10 text-rose-400' : 'bg-stone-800 text-stone-500'}`}>
          {item.symbol[0]}
        </div>
        <div>
          <div className="font-bold text-white text-base leading-none mb-1">{item.symbol}</div>
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">{item.name || 'Index'}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold font-mono tracking-tight shadow-lg ${colorClass}`}>
          {hasData ? (val > 0 ? '+' : '') + val.toFixed(2) + '%' : '-'}
        </div>
        <div className="text-[10px] text-stone-600 font-mono">
          Close: {item.close || item.currentPrice || 'N/A'}
        </div>
      </div>
    </div>
  );
}

function TimelineView({ onStockClick }) {
  // Feature Flags - Moved to top
  const timelineIndicesEnabled = useFeatureFlag('timeline_indices');
  const timelineSectorsEnabled = useFeatureFlag('timeline_sectors');
  const timelineEquityEnabled = useFeatureFlag('timeline_equity');
  const timelineViewEnabled = useFeatureFlag('marketTimeline_timeline');
  const snapshotViewEnabled = useFeatureFlag('marketTimeline_snapshot');

  // Adaptive UI Logic
  const enabledTimelineTabs = useMemo(() => {
    const tabs = [];
    if (timelineIndicesEnabled) tabs.push('indices');
    if (timelineSectorsEnabled) tabs.push('sectors');
    if (timelineEquityEnabled) tabs.push('equity');
    return tabs;
  }, [timelineIndicesEnabled, timelineSectorsEnabled, timelineEquityEnabled]);

  const enabledViews = useMemo(() => {
    const views = [];
    if (timelineViewEnabled) views.push('timeline');
    // if (snapshotViewEnabled) views.push('snapshot');
    return views;
  }, [timelineViewEnabled, snapshotViewEnabled]);

  const [data, setData] = useState({ dates: [], grid: {}, dateInfo: {} });
  const [indicesData, setIndicesData] = useState({ dates: [], grid: {}, dateInfo: {} });
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [indexCategoryFilter, setIndexCategoryFilter] = useState('Broad Market'); // Default to Broad Market per request
  const [capFilter, setCapFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('Day');

  // Initialize with valid first render value
  const [activeTab, setActiveTab] = useState(() => {
    if (enabledTimelineTabs.includes('indices')) return 'indices';
    return enabledTimelineTabs[0] || 'indices';
  });

  // Initialize with valid first render value
  const [activeView, setActiveView] = useState(() => {
    if (enabledViews.includes('timeline')) return 'timeline';
    return enabledViews[0] || 'timeline';
  });



  // Auto-correction for Timeline Tabs & Views
  useEffect(() => {
    if (enabledTimelineTabs.length > 0 && !enabledTimelineTabs.includes(activeTab)) {
      setActiveTab(enabledTimelineTabs[0]);
    }
    if (enabledViews.length > 0 && !enabledViews.includes(activeView)) {
      setActiveView(enabledViews[0]);
    }
  }, [activeTab, activeView, enabledTimelineTabs, enabledViews]);

  // Sorting State
  const [sortKey, setSortKey] = useState('symbol'); // 'symbol' or date string
  const [sortDir, setSortDir] = useState('asc'); // 'asc' or 'desc'

  // Fetching State
  const [dataOffset, setDataOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [snapshotData, setSnapshotData] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(50); // Performance: Limit columns

  // Use ref for lock to avoid closure staleness in onScroll
  const isFetchingRef = useRef(false);
  const scrollTicking = useRef(false); // For scroll debouncing with requestAnimationFrame

  // Helper to determine batch size
  const getBatchSize = () => {
    if (groupBy === 'Year' || groupBy === 'Month' || groupBy === 'Quarter') return 365;
    if (groupBy === 'Week') return 90;
    return 30; // Day default
  };

  const fetchTimelineData = async () => {
    setLoading(true);
    setIsInitialLoad(true);

    try {
      const v = API_BASE_URL === '/api' ? `?v=${Date.now()}` : '';
      const [stockRes, indexRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stocks-timeline.json${v}`).then(res => res.json()),
        fetch(`${API_BASE_URL}/indices-timeline.json${v}`).then(res => res.json())
      ]);

      // Process Stock Data
      if (stockRes.success && stockRes.data) {
        const grid = {};
        stockRes.data.data.forEach(row => {
          if (!grid[row.symbol]) {
            grid[row.symbol] = {
              symbol: row.symbol,
              name: row.name,
              subSector: row.sub_sector,
              marketCap: row.market_cap,
              capCategory: row.cap_category,
              history: {}
            };
          }
          grid[row.symbol].history[row.date] = row.day_return;
        });
        setData({ dates: stockRes.data.dates, grid, dateInfo: stockRes.data.dateInfo });
      }

      // Process Indices Data
      if (indexRes.success && indexRes.data) {
        const grid = {};
        indexRes.data.data.forEach(row => {
          if (!grid[row.name]) {
            grid[row.name] = {
              symbol: row.name, name: 'Index', isIndex: true, category: row.category || 'Other',
              close: row.close, pe: row.pe, history: {}, historyDetails: {}
            };
          }
          grid[row.name].history[row.date] = row.change_percent;
          grid[row.name].historyDetails[row.date] = row;
        });
        setIndicesData({ dates: indexRes.data.dates, grid, dateInfo: indexRes.data.dateInfo });
      }

      setHasMore(false); // Static data has no "more" to fetch via API
    } catch (err) {
      console.error('Failed to load static data:', err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Fetch Snapshot Data
  const fetchSnapshotData = () => {
    setLoading(true);
    const v = API_BASE_URL === '/api' ? `?v=${Date.now()}` : '';
    fetch(`${API_BASE_URL}/indices-snapshot.json${v}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setSnapshotData(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // State for Detail Modal
  const [selectedCell, setSelectedCell] = useState(null);

  // Initial Load & On GroupBy Change
  useEffect(() => {
    if (activeView === 'timeline') {
      if (timelineViewEnabled && data.dates.length === 0) {
        fetchTimelineData();
      }
    } else {
      if (snapshotViewEnabled) {
        fetchSnapshotData();
      }
    }
  }, [groupBy, activeView, timelineViewEnabled, snapshotViewEnabled]);

  // Performance: Reset limit when view changes
  useEffect(() => {
    setVisibleColumns(50);
  }, [groupBy]);



  // Check if we need more data after dates update
  useEffect(() => {
    if (activeView !== 'timeline') return;

    // Small delay to let DOM update
    const timer = setTimeout(() => {
      const scrollable = document.querySelector('[api-scroll="true"]');
      if (scrollable) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollable;
        const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);

        // If we're within 200px of the end, show more columns locally
        if (distanceFromEnd < 200) {
          setVisibleColumns(prev => {
            const max = (processedData.dates?.length || 0);
            return prev < max ? prev + 50 : prev;
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [data.dates, indicesData.dates, activeView]);

  // Processed Data based on current state
  const processedData = useMemo(() => {
    let list = activeTab === 'indices' ? [...Object.values(indicesData.grid)] : [...Object.values(data.grid)];
    const rawDates = activeTab === 'indices' ? indicesData.dates : data.dates;

    // 0. Fill Date Gaps to create a continuous calendar
    let sourceDates = [];
    if (rawDates.length > 0) {
      const todayIST = getISTDateString();
      const allDates = [...rawDates];
      if (!allDates.includes(todayIST)) allDates.push(todayIST);

      const sorted = allDates.sort((a, b) => b.localeCompare(a));
      const maxDate = new Date(sorted[0]);
      const minDate = new Date(sorted[sorted.length - 1]);

      const current = new Date(maxDate);
      while (current >= minDate) {
        sourceDates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() - 1);
      }
    }

    // 1. Select Source & Filter out Headline Indices (per user request)
    if (activeTab === 'indices') {
      // list is already initialized above
      if (indexCategoryFilter !== 'All') {
        list = list.filter(i => i.category === indexCategoryFilter);
      }
      // sourceDates is already initialized above
    } else {
      // list is already initialized above
      // sourceDates is already initialized above
    }

    // 2. Filter by Cap Category (Equity Only)
    // Indices: No filtering, we group them instead
    if (activeTab === 'equity') {
      if (capFilter !== 'All') {
        list = list.filter(s => s.capCategory === capFilter);
      }
    }

    // 3. Sector Aggregation (Only for Sector Tab)
    if (activeTab === 'sectors') {
      const sectorMap = {};
      list.forEach(stock => {
        const sec = stock.subSector || 'Other';
        if (!sectorMap[sec]) sectorMap[sec] = { symbol: sec, name: sec, isSector: true, history: {}, historyDetails: {}, count: 0 };

        sourceDates.forEach(d => {
          if (stock.history[d] !== undefined) {
            sectorMap[sec].history[d] = (sectorMap[sec].history[d] || 0) + stock.history[d];
          }
        });
        sectorMap[sec].count++;
      });

      // Average out
      Object.keys(sectorMap).forEach(k => {
        const s = sectorMap[k];
        sourceDates.forEach(d => {
          if (s.history[d] !== undefined) s.history[d] /= s.count;
        });
      });

      list = Object.values(sectorMap);
    }

    // 4. Specific Filters
    if (activeTab === 'equity' && sectorFilter !== 'All') {
      list = list.filter(s => s.subSector === sectorFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q)));
    }

    // Default Sort: Alphabetical by Symbol
    list.sort((a, b) => a.symbol.localeCompare(b.symbol));

    return { list, dates: sourceDates };
  }, [data, indicesData, activeTab, sectorFilter, capFilter, indexCategoryFilter, search]);

  // Aggregation Logic (Time Grouping) - OPTIMIZED O(1)
  const { groupedDates, groupedData, totalDates } = useMemo(() => {
    const { list, dates } = processedData;
    let datesToUse = [...dates].sort((a, b) => b.localeCompare(a));
    let displayDates = datesToUse;
    let finalData = list; // Start with filtered list
    let totalGroupsCount = 0;

    if (!groupBy || groupBy === 'Day') {
      // For Day View: Just slice the dates first!
      const limitedDates = datesToUse.slice(0, visibleColumns);
      totalGroupsCount = datesToUse.length;
      return { groupedDates: limitedDates, groupedData: finalData, totalDates: totalGroupsCount };
    } else {
      // Helper to get group key
      const getGroupKey = (dateStr) => {
        const d = new Date(dateStr);
        if (groupBy === 'Year') return `${d.getFullYear()}`;
        if (groupBy === 'Quarter') return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (groupBy === 'Month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (groupBy === 'Week') {
          // ISO Week
          const d2 = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
          d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
          const yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1));
          const weekNo = Math.ceil((((d2 - yearStart) / 86400000) + 1) / 7);
          return `${d2.getUTCFullYear()}-W${weekNo}`;
        }
        return dateStr;
      };

      // 1. Identify all unique groups first
      // Optimization: Create a Map of Group -> [Dates] once
      const groupMap = new Map();
      dates.forEach(d => {
        const k = getGroupKey(d);
        if (!groupMap.has(k)) groupMap.set(k, []);
        groupMap.get(k).push(d);
      });

      const allGroups = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));
      totalGroupsCount = allGroups.length;

      // 2. SLICE FIRST! (Lazy Aggregation)
      // Only calculate data for the columns we are actually going to show
      const limitedGroups = allGroups.slice(0, visibleColumns);

      // 3. Aggregate Data ONLY for visible groups
      finalData = list.map(item => {
        const newHistory = {};
        limitedGroups.forEach(g => {
          const rawDatesInGroup = groupMap.get(g) || [];
          let compounded = 1;
          let hasData = false;

          // Inner loop is now small (only dates within one group, e.g. 5 days or 30 days)
          for (const d of rawDatesInGroup) {
            const val = item.history[d];
            if (val !== undefined && val !== null) {
              compounded *= (1 + (val / 100));
              hasData = true;
            }
          }

          if (hasData) {
            newHistory[g] = (compounded - 1) * 100;
          }
        });
        return { ...item, history: newHistory };
      });

      displayDates = limitedGroups;
    }

    // 4. SORTING
    finalData.sort((a, b) => {
      // IF INDICES: Primary Sort is Category
      if (activeTab === 'indices') {
        const catA = a.category || 'Other';
        const catB = b.category || 'Other';
        if (catA !== catB) return catA.localeCompare(catB);
      }

      let valA, valB;
      if (sortKey === 'symbol') {
        valA = a.symbol || '';
        valB = b.symbol || '';
        if (valA === 'Nifty 50') return -1; // Keep Nifty Top
        if (valB === 'Nifty 50') return 1;
        return typeof valA === 'string' && typeof valB === 'string'
          ? (sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA))
          : 0;
      } else {
        valA = a.history[sortKey] !== undefined ? a.history[sortKey] : -Infinity;
        valB = b.history[sortKey] !== undefined ? b.history[sortKey] : -Infinity;
        if (valA === -Infinity && valB === -Infinity) return 0;
        if (valA === -Infinity) return 1;
        if (valB === -Infinity) return -1;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
    });

    return { groupedDates: displayDates, groupedData: finalData, totalDates: totalGroupsCount };

  }, [processedData, groupBy, sortKey, sortDir, activeTab, visibleColumns]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sectors = useMemo(() => {
    const s = new Set(Object.values(data.grid).filter(i => capFilter === 'All' || i.capCategory === capFilter).map(i => i.subSector).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [data, capFilter]);

  const indexCategories = useMemo(() => {
    const s = new Set(Object.values(indicesData.grid).map(i => i.category).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [indicesData]);

  // Calculate dynamic width
  const labelWidth = useMemo(() => {
    let maxLen = 0;
    const headerStr = activeTab === 'equity' ? 'Symbol' : activeTab === 'indices' ? 'Index Name' : 'Sector';
    maxLen = headerStr.length * 8 + 40;

    groupedData.forEach(item => {
      let len = (item.symbol.length * 8) + 40;
      if (activeTab === 'equity') len = Math.max(len, ((item.name || '').length * 6) + 40);
      if (len > maxLen) maxLen = len;
    });
    return Math.min(Math.max(220, maxLen), 400); // Increased min width for indices
  }, [groupedData, activeTab]);

  // Toggle View State

  if (loading) return <div className="h-full flex items-center justify-center text-stone-500 animate-pulse">Loading Timeline Matrix...</div>;

  const todayIST = getISTDateString();

  const getIsCurrentPeriod = (periodKey) => {
    const dObj = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const y = dObj.getFullYear();
    const m = dObj.getMonth() + 1;
    const q = Math.floor(dObj.getMonth() / 3) + 1;

    if (groupBy === 'Year') return periodKey === `${y}`;
    if (groupBy === 'Quarter') return periodKey === `${y}-Q${q}`;
    if (groupBy === 'Month') return periodKey === `${y}-${String(m).padStart(2, '0')}`;
    if (groupBy === 'Week') {
      const d2 = new Date(Date.UTC(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()));
      d2.setUTCDate(d2.getUTCDate() + 4 - (d2.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d2.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d2 - yearStart) / 86400000) + 1) / 7);
      return periodKey === `${d2.getUTCFullYear()}-W${weekNo}`;
    }
    return periodKey === todayIST;
  };

  return (
    <div className="h-full bg-[#1c1917] text-white flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">


      {/* VIEW CONTENT */}
      {activeView === 'timeline' && timelineViewEnabled ? (
        <>
          {/* MOBILE VIEW (CARD DASHBOARD) */}
          <div className="md:hidden flex-1 min-h-0 bg-[#131110]">
            <MobileDashboardView
              groupedData={groupedData}
              groupedDates={groupedDates}
              onStockClick={activeTab === 'equity' ? handleStockClick : () => { }}
              getChangeColor={getChangeColor}
            />
          </div>

          {/* DESKTOP VIEW (MATRIX GRID) */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 p-6 overflow-hidden">
            {/* CONTROL BAR */}
            <div className="flex justify-between items-center gap-3 mb-4 flex-none">

              <div className="flex gap-4 items-center">
                {/* View Toggle */}
                {enabledViews.length > 1 && (
                  <div className="flex bg-[#1E293B] p-1 rounded-lg h-9 items-center">
                    <button onClick={() => setActiveView('timeline')} className={`px-3 md:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'timeline' ? 'bg-[var(--surface-3)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Timeline</button>
                    <button onClick={() => setActiveView('snapshot')} className={`px-3 md:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeView === 'snapshot' ? 'bg-[var(--surface-3)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Snapshot</button>
                  </div>
                )}

                {/* Group By Tabs */}
                <div className="flex bg-[#1E293B] p-1 rounded-lg h-9 items-center">
                  {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((tab) => (
                    <button key={tab} onClick={() => setGroupBy(tab)} className={`px-5 py-0.5 h-7 flex items-center justify-center text-xs font-bold font-[family-name:var(--font-display)] rounded-md transition-all ${groupBy === tab ? 'bg-[var(--surface-3)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search Pill */}
                <div className="relative group ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-hover:text-[var(--accent)] transition-colors opacity-70">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search indices..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-[#1E293B] border border-slate-700/50 rounded-lg pl-9 pr-4 py-1.5 h-9 text-stone-300 text-xs font-bold font-[family-name:var(--font-display)] w-48 focus:outline-none focus:border-[var(--accent)] focus:w-64 transition-all flex items-center placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {/* Category / Sector Filter */}
                {(activeTab === 'equity' || activeTab === 'sectors') && (
                  <div className="flex items-center gap-2 px-3 bg-[#1E293B] hover:bg-[#2D3748] rounded-lg text-xs text-slate-300 border border-slate-700/50 transition-colors relative h-9">
                    <span className="opacity-70">Sector:</span>
                    <select
                      value={sectorFilter}
                      onChange={e => setSectorFilter(e.target.value)}
                      className="bg-transparent font-medium text-white focus:outline-none appearance-none pr-4 cursor-pointer"
                    >
                      {sectors.map(s => <option key={s} value={s} className="bg-[#1E293B] text-slate-300">{s}</option>)}
                    </select>
                    <span className="text-[10px] opacity-50 absolute right-2 pointer-events-none">▼</span>
                  </div>
                )}

                {activeTab === 'indices' && (
                  <div className="flex items-center gap-2 px-3 bg-[#1E293B] hover:bg-[#2D3748] rounded-lg text-xs text-slate-300 border border-slate-700/50 transition-colors relative h-9 font-[family-name:var(--font-display)]">
                    <span className="opacity-70 font-bold">Category:</span>
                    <select
                      value={indexCategoryFilter}
                      onChange={e => setIndexCategoryFilter(e.target.value)}
                      className="bg-transparent font-bold text-white focus:outline-none appearance-none pr-4 cursor-pointer"
                    >
                      {indexCategories.map(s => <option key={s} value={s} className="bg-[#1E293B] text-slate-300">{s}</option>)}
                    </select>
                    <span className="text-[10px] opacity-50 absolute right-2 pointer-events-none">▼</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className="border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-[var(--surface-base)] flex-1 flex flex-col relative"
            >
              <div
                api-scroll="true"
                className="flex-1 overflow-auto custom-scrollbar relative pb-0"
                onScroll={(e) => {
                  // Debounce scroll events using requestAnimationFrame for 60fps
                  if (!scrollTicking.current) {
                    window.requestAnimationFrame(() => {
                      const { scrollLeft, scrollWidth, clientWidth } = e.target;
                      const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);

                      const isAtEndOfMemory = groupedDates.length >= (processedData.dates?.length || 0);

                      if (distanceFromEnd < 200 && !loading) {
                        const maxDates = processedData.dates?.length || 0;
                        if (visibleColumns < maxDates) {
                          setVisibleColumns(prev => prev + 50);
                        }
                      }

                      scrollTicking.current = false;
                    });
                    scrollTicking.current = true;
                  }
                }}
              >
                <div className="min-w-max bg-[var(--surface-base)]">
                  {/* ... Header ... */}
                  <div className="flex sticky top-0 z-20 bg-[var(--surface-base)] border-b border-[var(--border-subtle)] shadow-md">
                    {/* ... */}
                    <div
                      className="p-4 pl-6 text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest sticky left-0 z-30 bg-[var(--surface-base)] border-r border-[var(--border-subtle)] flex-none flex items-center group font-[family-name:var(--font-display)]"
                      style={{ width: `${labelWidth}px`, height: '72px' }}
                    >
                      INDEX
                    </div>
                    {groupedDates.map((d, i) => {
                      let topLabel = '';
                      let bottomLabel = '';

                      if (groupBy === 'Day') {
                        const dateObj = new Date(d);
                        if (!isNaN(dateObj)) {
                          topLabel = dateObj.getDate();
                          bottomLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        }
                      } else if (groupBy === 'Week') {
                        const [year, week] = d.split('-W');
                        topLabel = `W${week}`;
                        bottomLabel = year;
                      } else if (groupBy === 'Month') {
                        const [year, month] = d.split('-');
                        const dateObj = new Date(year, parseInt(month) - 1);
                        if (!isNaN(dateObj)) {
                          topLabel = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                          bottomLabel = year;
                        }
                      } else if (groupBy === 'Quarter') {
                        const [year, q] = d.split('-');
                        topLabel = q;
                        bottomLabel = year;
                      } else if (groupBy === 'Year') {
                        topLabel = d;
                        bottomLabel = '';
                      }

                      const isDayView = !groupBy || groupBy === 'Day';
                      const isCurrentPeriod = getIsCurrentPeriod(d);
                      const isHoliday = isDayView && isMarketClosed(d);
                      const holidayName = isHoliday ? MARKET_HOLIDAYS[d] || 'Market Closed' : null;

                      const hasData = groupedData.some(item => item.history[d] !== undefined);

                      return (
                        <div key={d} className="w-[100px] py-1 px-1 text-center border-r border-[var(--border-subtle)] flex-none cursor-default bg-[var(--surface-1)] flex flex-col justify-center items-center gap-1" style={{ height: '72px' }}>
                          <span className={`text-[13px] font-bold font-[family-name:var(--font-display)] ${isCurrentPeriod ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{topLabel}</span>
                          <span className={`text-[10px] font-bold tracking-tight leading-[1.1] uppercase text-center w-full px-1 break-words ${isHoliday && MARKET_HOLIDAYS[d] ? 'text-amber-500/90' : 'text-[var(--text-muted)]'}`}>
                            {isHoliday ? (holidayName === 'Market Closed' ? 'MARKET CLOSED' : holidayName) :
                              (isCurrentPeriod && !hasData ? 'DATA ~4PM' : bottomLabel)}
                          </span>
                          {/* Sort Removed */}
                        </div>
                      );
                    })}

                    {/* LOAD MORE DATES COLUMN */}
                    {groupedDates.length < totalDates && (
                      <div className="w-[100px] flex-none border-r border-[var(--border-subtle)] bg-transparent border-l border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all group z-10"
                        onClick={() => setVisibleColumns(prev => prev + 50)} style={{ height: '72px' }}>
                        <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-xl font-bold text-white group-hover:scale-110 transition-transform">→</span>
                          <span className="text-[10px] text-white font-bold">LOAD MORE</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ... Rows ... */}
                  <div className="bg-[var(--surface-base)]">
                    {groupedData.map((item, i) => {
                      // Visual Grouping: Add margin if category changes (Indices only)
                      const prevItem = groupedData[i - 1];
                      const isNewCategory = activeTab === 'indices' && i > 0 && item.category !== prevItem?.category;

                      return (
                        <div key={item.symbol} className={`flex hover:bg-white/[0.04] transition-colors duration-100 ease-out group border-b border-[#1E293B]/50 ${isNewCategory ? 'mt-8 border-t border-t-[#334155]/50' : ''}`}>
                          {/* ... Symbol ... */}
                          <div
                            className={`p-0 pl-6 text-sm font-bold text-[var(--text-primary)] border-r border-[var(--border-subtle)] sticky left-0 z-10 bg-[var(--surface-base)] flex flex-col justify-center truncate flex-none transition-all duration-200 cursor-pointer`}
                            style={{ width: `${labelWidth}px`, height: '56px' }}
                            onClick={() => handleStockClick(item)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`${item.symbol === 'Nifty 50' ? 'text-white' : 'text-slate-300'} text-[13px] group-hover:text-[var(--accent)] transition-colors`}>{item.symbol}</span>
                            </div>
                          </div>
                          {/* ... Cells ... */}
                          {groupedDates.map((d, idx) => {
                            const isDayView = !groupBy || groupBy === 'Day';
                            const todayIST = getISTDateString();
                            const isToday = isDayView && d === todayIST;
                            const isCurrentPeriod = getIsCurrentPeriod(d);
                            const isHoliday = isDayView && isMarketClosed(d);
                            const val = item.history[d];
                            const hasData = val !== undefined;
                            const details = item.historyDetails?.[d];

                            if (isDayView && !hasData) {
                              return (
                                <div key={d} className="w-[100px] border-r border-[var(--border-subtle)] flex-none flex items-center justify-center bg-white/[0.01]">
                                  <span className="text-[9px] font-bold text-slate-600 tracking-tighter uppercase text-center px-1">
                                    {isCurrentPeriod ? (isHoliday ? 'Market opens next day' : 'Available @ 4PM') : '-'}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div key={d} className={`w-[100px] flex-none border-r border-[var(--border-subtle)] p-[2px]`} style={{ height: '52px' }}>
                                <div
                                  onClick={() => { if (groupBy === 'Day' && details) setSelectedCell({ symbol: item.symbol, date: d, details }); }}
                                  className={`w-full h-full flex items-center justify-center pr-0 rounded text-[13px] font-[family-name:var(--font-mono)] font-medium tabular-nums transition-all duration-200 ${isToday ? 'ring-1 ring-[var(--gain-2)]/30' : ''} ${hasData ? getChangeColor(val) : ''} ${details ? 'cursor-pointer hover:scale-[1.05] hover:shadow-lg hover:z-20 relative' : ''}`}
                                >
                                  {hasData && <span className="mr-1 opacity-60 text-[10px] transform scale-100">{val > 0 ? '▲' : val < 0 ? '▼' : ''}</span>}
                                  {hasData ? (val > 0 ? '+' : '') + val.toFixed(2) + '%' : '-'}
                                </div>
                              </div>
                            );
                          })}

                          {/* LOAD MORE PLACEHOLDER */}
                          {groupedDates.length < (processedData.dates?.length || 0) && (
                            <div className="w-[100px] flex-none border-r border-[var(--border-subtle)] bg-transparent hover:bg-white/[0.02] transition-colors cursor-pointer border-l border-white/5" style={{ height: '52px' }} onClick={() => setVisibleColumns(prev => prev + 50)}>
                              <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-[var(--accent)] font-bold text-xs">+</div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                  {/* Inline Loading Indicator for Infinite Scroll */}
                  {isFetchingMore && (
                    <div className="flex items-center justify-center p-8 bg-stone-900/50 border-t border-white/10">
                      <Spinner size="md" />
                      <span className="ml-3 text-sm text-stone-400">Loading more data...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>


      ) : activeView === 'snapshot' && snapshotViewEnabled && (
        <TimelineSnapshot data={snapshotData} />
      )
      }

      {/* Details Modal */}
      {
        selectedCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCell(null)}>
            <div className="bg-[#1c1917] border border-white/10 rounded-xl shadow-2xl p-6 w-[500px]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCell.symbol}</h3>
                  <p className="text-stone-400 text-sm">{selectedCell.date}</p>
                </div>
                <button onClick={() => setSelectedCell(null)} className="text-stone-500 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Open" value={selectedCell.details.open} />
                <DetailRow label="High" value={selectedCell.details.high} />
                <DetailRow label="Low" value={selectedCell.details.low} />
                <DetailRow label="Close" value={selectedCell.details.close} />

                <div className="col-span-2 h-px bg-white/10 my-2"></div>

                <DetailRow label="Change Points" value={selectedCell.details.change_points} color={true} />
                <DetailRow label="Change %" value={selectedCell.details.change_percent + '%'} color={true} />

                <div className="col-span-2 h-px bg-white/10 my-2"></div>

                <DetailRow label="Volume" value={selectedCell.details.volume ? (selectedCell.details.volume / 1000000).toFixed(2) + 'M' : '-'} />
                <DetailRow label="Turnover" value={selectedCell.details.turnover ? '₹' + (selectedCell.details.turnover / 100).toFixed(2) + 'Cr' : '-'} />

                <div className="col-span-2 h-px bg-white/10 my-2"></div>

                <DetailRow label="P/E" value={selectedCell.details.pe} />
                <DetailRow label="P/B" value={selectedCell.details.pb} />
                <DetailRow label="Div Yield" value={selectedCell.details.div_yield} />
              </div>
            </div>
          </div>
        )
      }
    </div >

  );
}

function DetailRow({ label, value, color }) {
  const isPos = typeof value === 'string' ? !value.includes('-') : value > 0;
  const valStr = value !== undefined && value !== null ? value : '-';

  return (
    <div className="flex justify-between items-center">
      <span className="text-stone-500 text-xs uppercase tracking-wide">{label}</span>
      <span className={`font-mono font-medium ${color ? (value > 0 || (typeof value === 'string' && !value.includes('-') && value !== '0.00%') ? 'text-emerald-400' : (value < 0 || (typeof value === 'string' && value.includes('-')) ? 'text-rose-400' : 'text-stone-300')) : 'text-stone-200'}`}>
        {valStr}
      </span>
    </div>
  );
}


function TimelineSnapshot({ data }) {
  const snapshotIndicesEnabled = useFeatureFlag('snapshot_indices');
  const snapshotSectorsEnabled = useFeatureFlag('snapshot_sectors');
  const snapshotEquityEnabled = useFeatureFlag('snapshot_equity');

  const [activeFilter, setActiveFilter] = useState('Indices');

  const enabledFilters = useMemo(() => {
    const filters = [];
    if (snapshotIndicesEnabled) filters.push('Indices');
    if (snapshotSectorsEnabled) filters.push('Sectors');
    if (snapshotEquityEnabled) filters.push('Equity');
    return filters;
  }, [snapshotIndicesEnabled, snapshotSectorsEnabled, snapshotEquityEnabled]);

  // Auto-correction
  useEffect(() => {
    if (enabledFilters.length > 0 && !enabledFilters.includes(activeFilter)) {
      setActiveFilter(enabledFilters[0]);
    }
  }, [activeFilter, enabledFilters]);

  // Content filtering logic
  const filteredData = useMemo(() => {
    return data.filter(row => row.fallPercent != null && row.currentClose != null).sort((a, b) => a.fallPercent - b.fallPercent);
  }, [data]);

  if (enabledFilters.length === 0) return null;

  return (
    <div className="flex-1 overflow-auto custom-scrollbar p-8 bg-[#1c1917]">
      <div className="max-w-7xl mx-auto">
        {enabledFilters.length > 1 && (
          <div className="flex gap-2 mb-6 justify-center">
            {enabledFilters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeFilter === f ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white/5 text-stone-500 hover:text-stone-300'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="bg-[#292524] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-stone-400 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="p-4 font-bold border-r border-white/5">Index Name</th>
                <th className="p-4 text-right border-r border-white/5">Current</th>
                <th className="p-4 text-center border-r border-white/5 w-48">% Fall from 52W High</th>
                <th className="p-4 text-right border-r border-white/5">52W High</th>
                <th className="p-4 text-right text-stone-500 border-r border-white/5">-10% Fall</th>
                <th className="p-4 text-right text-stone-500 border-r border-white/5">-15% Fall</th>
                <th className="p-4 text-right text-stone-500 border-r border-white/5">-20% Fall</th>
                <th className="p-4 text-right text-stone-500">-25% Fall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map((row) => (
                <tr key={row.name} className="hover:bg-white/5 transition-colors group text-sm">
                  <td className={`p-4 font-bold border-r border-white/5 ${row.name === 'Nifty 50' ? 'text-emerald-400' : 'text-stone-200'}`}>{row.name}</td>
                  <td className="p-4 text-right font-mono border-r border-white/5">{row.currentClose?.toLocaleString() || '-'}</td>
                  <td className="p-4 border-r border-white/5 relative h-full align-middle text-right">
                    <span className="font-bold text-rose-400 relative z-10">{row.fallPercent?.toFixed(2) || '0.00'}%</span>
                    <div className="absolute top-4 bottom-4 right-4 bg-rose-500/20 rounded-l transition-all" style={{ width: `${Math.min(Math.abs(row.fallPercent || 0) * 5, 100)}px` }}></div>
                  </td>
                  <td className="p-4 text-right font-mono text-stone-400 border-r border-white/5">{row.fiftyTwoWeekHigh?.toLocaleString() || '-'}</td>
                  <td className={`p-4 text-right font-mono border-r border-white/5 ${row.currentClose < row.level10 ? 'bg-rose-900/20 text-rose-300 font-bold' : 'text-stone-500'}`}>
                    {row.currentClose < row.level10 ? 'Done' : (row.level10?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '-')}
                  </td>
                  <td className={`p-4 text-right font-mono border-r border-white/5 ${row.currentClose < row.level15 ? 'bg-rose-900/30 text-rose-300 font-bold' : 'text-stone-500'}`}>
                    {row.currentClose < row.level15 ? 'Done' : (row.level15?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '-')}
                  </td>
                  <td className={`p-4 text-right font-mono border-r border-white/5 ${row.currentClose < row.level20 ? 'bg-rose-900/40 text-rose-300 font-bold' : 'text-stone-500'}`}>
                    {row.currentClose < row.level20 ? 'Done' : (row.level20?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '-')}
                  </td>
                  <td className={`p-4 text-right font-mono ${row.currentClose < row.level25 ? 'bg-rose-900/50 text-rose-300 font-bold' : 'text-stone-500'}`}>
                    {row.currentClose < row.level25 ? 'Done' : (row.level25?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ===========================
// STOCK DETAIL MODAL
// ===========================
function StockModal({ stock, onClose, isWatchlisted, onToggleWatchlist }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (stock) {
      // In production static environment, we don't have per-stock detail endpoints.
      // We will skip this fetch and rely on the data already loaded in the main app if available.
      if (API_BASE_URL === '/api') {
        // If we want to support this, we'd need to pre-generate these files.
        // For now, prevent the fetch that causes SyntaxError.
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = `${API_BASE_URL}/stocks/${stock.symbol}.json`; // Try to use .json even if not guarded

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) {
            throw new Error("Not JSON");
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.data.history) setHistory(data.data.history);
          setLoading(false);
        })
        .catch(() => {
          // Fallback: If stock detail fails (expected in static-prod), just stop loading
          setLoading(false);
        });
    }
  }, [stock]);

  if (!stock) return null;
  const change = parseFloat(stock.change) || 0;
  const openPrice = calculateOpenPrice(stock.currentPrice, stock.change);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div
        className="bg-[#1c1917]/90 backdrop-blur-xl border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
              {stock.symbol}
              <button
                onClick={onToggleWatchlist}
                className={`text-2xl transition-all hover:scale-110 active:scale-95 ${isWatchlisted ? 'text-yellow-400' : 'text-stone-600 hover:text-stone-400'}`}
                title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
              >
                {isWatchlisted ? '★' : '☆'}
              </button>
            </h2>
            <p className="text-stone-400 font-medium">{stock.name}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-stone-300 border border-white/5">
              {stock.subSector}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Price', val: `₹${stock.currentPrice}`, highlight: true },
            { label: 'Prev Close', val: `₹${openPrice}`, highlight: false },
            { label: '1D Change', val: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`, color: change >= 0 ? 'text-emerald-400' : 'text-orange-400' },
            { label: 'Mkt Cap', val: formatMarketCap(stock.marketCap), highlight: false }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">{item.label}</span>
              <span className={`text-sm font-mono font-medium ${item.color || 'text-stone-200'}`}>{item.val}</span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-stone-200 font-medium mb-4 text-sm flex items-center gap-2">
            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
            Price History
          </h3>
          {loading ? (
            <div className="h-32 flex items-center justify-center text-stone-500 text-sm animate-pulse">Loading data...</div>
          ) : history.length > 0 ? (
            <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {history.slice(-7).reverse().map((h, i) => (
                <div key={i} className="flex justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5 md:hover:bg-white/10 transition-colors text-sm">
                  <span className="text-stone-400 font-mono">{h.date}</span>
                  <span className="text-stone-200 font-mono">₹{h.close}</span>
                  <span className={`font-mono ${parseFloat(h.change) >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {parseFloat(h.change).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-stone-500 text-sm">No history available</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// SECTORS VIEW
// ===========================
function SectorView({ stocks, categories, onStockClick }) {
  const [selectedSector, setSelectedSector] = useState(null);

  const sectorStats = useMemo(() => {
    return Object.entries(categories).map(([key, cat]) => {
      const sectorStocks = cat.stocks.map(s => stocks[s]).filter(Boolean);
      const avgChange = sectorStocks.length > 0
        ? sectorStocks.reduce((sum, s) => sum + (parseFloat(s.change) || 0), 0) / sectorStocks.length
        : 0;
      return { key, ...cat, avgChange, stockCount: sectorStocks.length, stockData: sectorStocks };
    }).sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks, categories]);

  const selected = selectedSector ? sectorStats.find(s => s.key === selectedSector) : sectorStats[0];

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Market Sectors</h3>
        </div>
        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
          {sectorStats.map(sector => (
            <div
              key={sector.key}
              onClick={() => setSelectedSector(sector.key)}
              className={`p-3 rounded-xl cursor-pointer mb-1 flex justify-between items-center transition-all duration-200 group ${selected?.key === sector.key
                ? 'bg-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/10'
                : 'hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className="flex flex-col flex-1 min-w-0 pr-3">
                <span className={`text-sm font-medium truncate ${selected?.key === sector.key ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`}>
                  {sector.name.replace(/^[^\w]+/, '')}
                </span>
                <span className="text-stone-600 text-[10px] uppercase tracking-wide mt-0.5">{sector.stockCount} Assets</span>
              </div>
              <span className={`text-xs font-mono font-medium whitespace-nowrap px-2 py-1 rounded-md ${sector.avgChange >= 0
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {selected && (
          <>
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl">
              <div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-stone-300 border border-white/5">{selected.stockData.length} CONSTITUENTS</span>
                  <span className="text-stone-500 text-xs">•</span>
                  <span className="text-stone-400 text-xs">Sector Overview</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold block mb-1">Avg Rtn</span>
                <span className={`text-3xl font-light tracking-tighter ${getChangeTextColor(selected.avgChange)}`}>
                  {selected.avgChange >= 0 ? '+' : ''}{selected.avgChange.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
              {['Large Cap', 'Mid Cap', 'Small Cap'].map(tier => {
                const tierStocks = selected.stockData.filter(s => {
                  const cap = s.marketCap || 0;
                  if (tier === 'Large Cap') return cap >= 50000;
                  if (tier === 'Mid Cap') return cap >= 15000 && cap < 50000;
                  return cap < 15000;
                });

                if (!tierStocks.length) return null;

                const avgChange = tierStocks.reduce((sum, s) => sum + (parseFloat(s.change) || 0), 0) / tierStocks.length;

                return (
                  <div key={tier}>
                    <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
                      <h3 className="text-stone-300 font-bold text-sm tracking-wide">{tier}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-stone-300 font-mono">{tierStocks.length}</span>
                        <span className={`text-xs font-mono font-bold ${avgChange >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                          {avgChange > 0 ? '+' : ''}{avgChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {tierStocks.map(stock => (
                        <div
                          key={stock.symbol}
                          onClick={() => onStockClick(stock)}
                          className={`${getChangeColor(stock.change)} p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-white/5 relative group overflow-hidden flex flex-col justify-between h-24`}
                        >
                          <div className="flex justify-between items-start z-10">
                            <span className="font-bold text-white text-xs tracking-wide">{stock.symbol}</span>
                          </div>

                          <div className="z-10">
                            <div className="text-white font-medium text-lg tracking-tight leading-none mb-1">
                              {parseFloat(stock.change) >= 0 ? '+' : ''}{parseFloat(stock.change).toFixed(2)}%
                            </div>
                            <div className="text-white/60 text-[10px] font-mono">₹{stock.currentPrice}</div>
                          </div>

                          {/* Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {selected.stockData.length === 0 && (
                <div className="h-full flex items-center justify-center text-stone-600 font-medium">No assets in this sector</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===========================
// ANALYTICS VIEW
// ===========================
function MarketMovers({ stocks }) {
  const movers = useMemo(() => {
    const list = Object.values(stocks);
    if (!list.length) return { gainers: [], losers: [] };
    const sorted = [...list].sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
    return {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse()
    };
  }, [stocks]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-white font-semibold text-sm mb-3 flex justify-between shrink-0">
        <span>Top Movers</span>
        <span className="text-[10px] text-stone-500">TODAY'S EXTREMES</span>
      </h3>
      <div className="flex-1 overflow-hidden flex flex-col gap-2">
        {/* Top 3 Gainers */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Top Gainers</div>
          {movers.gainers.slice(0, 3).map(s => (
            <div key={s.symbol} className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded hover:bg-white/10 transition-colors">
              <div className="flex gap-2 items-center min-w-0">
                <span className="font-bold text-white truncate w-16">{s.symbol}</span>
                <span className="text-stone-400 text-[10px] truncate flex-1">{formatMarketCap(s.marketCap)}</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">+{parseFloat(s.change).toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div className="h-px bg-white/5 shrink-0"></div>
        {/* Top 3 Losers */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Top Losers</div>
          {movers.losers.slice(0, 3).map(s => (
            <div key={s.symbol} className="flex justify-between items-center text-xs bg-white/5 p-1.5 rounded hover:bg-white/10 transition-colors">
              <div className="flex gap-2 items-center min-w-0">
                <span className="font-bold text-white truncate w-16">{s.symbol}</span>
                <span className="text-stone-400 text-[10px] truncate flex-1">{formatMarketCap(s.marketCap)}</span>
              </div>
              <span className="text-orange-500 font-mono font-bold">{parseFloat(s.change).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ stocks, categories }) {
  const [chartMode, setChartMode] = useState('heatmap'); // 'heatmap' or 'scatter'

  const sectorPerformance = useMemo(() => {
    return Object.entries(categories).map(([key, cat]) => {
      const sectorStocks = cat.stocks.map(s => stocks[s]).filter(Boolean);
      const avgChange = sectorStocks.length > 0
        ? sectorStocks.reduce((sum, s) => sum + (parseFloat(s.change) || 0), 0) / sectorStocks.length
        : 0;

      const gainers = sectorStocks.filter(s => parseFloat(s.change) > 0).length;
      const losers = sectorStocks.filter(s => parseFloat(s.change) < 0).length;

      return {
        name: cat.name.replace(/^[^\w]+/, '').trim(),
        avgChange,
        gainers,
        losers,
        total: sectorStocks.length
      };
    }).sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks, categories]);
  // Calculate market stats for Gauge
  const marketStats = useMemo(() => {
    const list = Object.values(stocks);
    if (!list.length) return { gainers: 0, decliners: 0 };
    const gainers = list.filter(s => parseFloat(s.change) > 0).length;
    return { gainers, decliners: list.length - gainers };
  }, [stocks]);

  const performanceSectors = sectorPerformance;
  const breadthSectors = [...sectorPerformance].sort((a, b) => b.total - a.total);

  return (
    <div className="h-[calc(100vh-140px)] overflow-hidden flex flex-row gap-6">

      {/* 1. VISUAL MAIN STAGE (70%) */}
      <div className="flex-[0.70] flex flex-col gap-6 h-full min-w-0">

        {/* PRIMARY VISUAL: GALAXY / BUBBLES */}
        <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col relative group/chart overflow-hidden">
          <div className="flex justify-between items-start mb-4 z-10 flex-none">
            <div>
              <h3 className="text-white font-semibold text-base tracking-wide flex items-center gap-2">
                <span className="text-xl">🌌</span>
                {chartMode === 'scatter' ? 'Market Galaxy' : 'Sector Universe'}
              </h3>
              <p className="text-stone-500 text-xs mt-1">
                {chartMode === 'scatter' ? 'Visualizing Market Cap vs Returns' : 'Bubble Size = Market Cap • Color = Return'}
              </p>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setChartMode('heatmap')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartMode === 'heatmap' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
              >
                Bubbles
              </button>
              <button
                onClick={() => setChartMode('scatter')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${chartMode === 'scatter' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
              >
                Galaxy
              </button>
            </div>
          </div>

          <div className="flex-1 relative w-full min-h-0 rounded-xl overflow-hidden border border-white/5 bg-black/20">
            {chartMode === 'scatter' ? (
              <MarketScatterChart stocks={stocks} />
            ) : (
              <SectorBubbleChart sectors={sectorPerformance} />
            )}
          </div>
        </div>

        {/* BOTTOM ROW: DISTRIBUTION + PROPULSION + MOVERS */}
        <div className="h-56 flex-none flex gap-6">
          {/* DISTRIBUTION */}
          <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col">
            <MarketDistributionChart stocks={stocks} />
          </div>

          {/* PROPULSION */}
          <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col">
            <h3 className="text-white font-semibold text-sm mb-2 flex justify-between">
              <span>Market Propulsion</span>
              <span className="text-[10px] text-stone-500">WEIGHTED CONTRIBUTION</span>
            </h3>
            <div className="flex-1 min-h-0 overflow-hidden">
              <MarketPropulsionChart sectors={sectorPerformance} />
            </div>
          </div>

          {/* MOVERS */}
          <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col">
            <MarketMovers stocks={stocks} />
          </div>
        </div>

      </div>


      {/* 2. DATA SIDEBAR (30%) */}
      <div className="flex-[0.30] flex flex-col gap-4 h-full min-w-[320px]">

        {/* SENTIMENT + TIERS */}
        <div className="flex-none bg-[#1c1917]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-lg overflow-hidden p-4 gap-4">
          {/* Gauge */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase mb-1">Sentiment</h2>
              <div className="text-[10px] text-stone-500">ADVANCE / DECLINE</div>
            </div>
            <SentimentGauge marketStats={marketStats} />
          </div>

          {/* Cap Tiers */}
          <div>
            <h2 className="text-[10px] font-bold text-stone-500 tracking-wide uppercase mb-2">Cap Tiers</h2>
            <CapTierWidget stocks={stocks} />
          </div>
        </div>

        {/* SECTOR LIST */}
        <div className="flex-1 bg-[#1c1917]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-lg overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
              Sector Leaderboard
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-0.5">
            {performanceSectors.map((s, i) => (
              <div key={i} className="flex items-center text-[11px] hover:bg-white/5 p-2 rounded-lg transition-colors group cursor-default border border-transparent hover:border-white/5">
                <div className="flex-1 text-stone-400 group-hover:text-stone-200 truncate font-medium pr-2 transition-colors">{s.name}</div>

                {/* Visual Bar */}
                <div className="w-16 h-1 bg-white/5 rounded-full mr-3 relative overflow-hidden">
                  {s.avgChange >= 0 ? (
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/80" style={{ width: `${Math.min(100, Math.abs(s.avgChange) * 20)}%` }}></div>
                  ) : (
                    <div className="absolute left-0 top-0 bottom-0 bg-orange-600/80" style={{ width: `${Math.min(100, Math.abs(s.avgChange) * 20)}%` }}></div>
                  )}
                </div>

                <div className={`w-12 text-right font-mono font-bold ${s.avgChange >= 0 ? 'text-emerald-400' : 'text-orange-500'}`}>
                  {s.avgChange > 0 ? '+' : ''}{s.avgChange.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

// ===========================
// TABLE VIEW
// ===========================
function TableView({ stocks, categories, onStockClick }) {
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const sortedStocks = useMemo(() => {
    let list = Object.values(stocks);
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(f) ||
        s.name?.toLowerCase().includes(f) ||
        s.subSector?.toLowerCase().includes(f)
      );
    }
    list.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      if (sortBy === 'change' || sortBy === 'currentPrice' || sortBy === 'marketCap') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [stocks, sortBy, sortDir, filter]);

  const pageData = sortedStocks.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sortedStocks.length / pageSize);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
        <h2 className="text-lg font-semibold text-white tracking-tight">Full Market Ledger</h2>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search assets..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-stone-200 text-sm w-64 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all font-medium"
          />
          {/* <span className="absolute right-3 top-2 text-stone-600 group-focus-within:text-stone-400">⌘K</span> */}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#1c1917]/80 text-stone-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 backdrop-blur-md">
            <tr>
              {['symbol', 'name', 'subSector', 'prevClose', 'currentPrice', 'change', 'marketCap'].map((col, i) => (
                <th
                  key={col}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:text-stone-300 transition-colors ${i > 2 ? 'text-right' : ''}`}
                  onClick={() => col !== 'prevClose' && handleSort(col)}
                >
                  <div className={`flex items-center gap-1 ${i > 2 ? 'justify-end' : ''}`}>
                    {col === 'subSector' ? 'Sector' : col === 'currentPrice' ? 'Price' : col === 'change' ? '1D%' : col === 'marketCap' ? 'Mkt Cap' : col === 'prevClose' ? 'Prev Close' : col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortBy === col && (
                      <span className="text-emerald-500">{sortDir === 'desc' ? '↓' : '↑'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pageData.map((stock, i) => (
              <tr
                key={stock.symbol}
                onClick={() => onStockClick(stock)}
                className="cursor-pointer hover:bg-white/5 transition-colors group"
              >
                <td className="p-3 pl-4 font-semibold text-white group-hover:text-emerald-300 transition-colors">{stock.symbol}</td>
                <td className="p-3 text-stone-400 font-medium truncate max-w-[180px]">{stock.name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-stone-500 border border-white/5 group-hover:border-white/10 transition-colors truncate max-w-[140px] inline-block">{stock.subSector}</span>
                </td>
                <td className="p-3 text-right text-stone-500 font-mono tracking-tight">₹{calculateOpenPrice(stock.currentPrice, stock.change)}</td>
                <td className="p-3 text-right text-stone-200 font-bold font-mono tracking-tight">₹{stock.currentPrice}</td>
                <td className="p-3 text-right font-medium font-mono">
                  <span className={`px-1.5 py-0.5 rounded ${parseFloat(stock.change) >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                    {parseFloat(stock.change) >= 0 ? '+' : ''}{parseFloat(stock.change).toFixed(2)}%
                  </span>
                </td>
                <td className="p-3 pr-4 text-right text-stone-500 font-mono tracking-tight">{formatMarketCap(stock.marketCap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-3 border-t border-white/5 bg-white/5 text-xs font-medium text-stone-500">
        <span>{page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedStocks.length)} of {sortedStocks.length}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors text-stone-300 border border-white/5"
          >
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-colors text-stone-300 border border-white/5"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================
// WATCHLIST VIEW
// ===========================
function WatchlistView({ stocks, watchlists, activeListName, onSelectList, onCreateList, onDeleteList, onStockClick, onToggleWatchlist }) {
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const activeWatchlist = watchlists[activeListName] || new Set();

  const watchlistStocks = useMemo(() => {
    return Array.from(activeWatchlist).map(symbol => stocks[Symbol.for(symbol)] || Object.values(stocks).find(s => s.symbol === symbol)).filter(Boolean);
  }, [stocks, activeWatchlist]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const lower = search.toLowerCase();
    return Object.values(stocks).filter(s =>
      s.symbol.toLowerCase().includes(lower) ||
      s.name.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [stocks, search]);

  return (
    <div className="h-full flex gap-6">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Lists</h3>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {Object.keys(watchlists).map(name => (
            <div
              key={name}
              onClick={() => onSelectList(name)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all group relative ${activeListName === name ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-stone-400 hover:bg-white/5 border-transparent'}`}
            >
              <span className="text-lg">{name === 'Equity' ? '📋' : '📑'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{name}</div>
                <div className={`text-[10px] ${activeListName === name ? 'text-emerald-500/70' : 'text-stone-600'}`}>{watchlists[name].size} Items</div>
              </div>
              {name !== 'Equity' && (
                <button
                  onClick={(e) => onDeleteList(name, e)}
                  className="absolute right-2 text-stone-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/5 mt-auto">
          <button
            onClick={onCreateList}
            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-stone-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span>+</span> Create New List
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-[#1c1917]/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">

        {/* HEADER & SEARCH */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 z-20 relative">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {activeListName}
            </h2>
            <div className="text-xs text-stone-500 mt-1">Track your favorite assets</div>
          </div>

          <div className="relative w-80 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">🔍</div>
            <input
              type="text"
              placeholder={`Add to ${activeListName}...`}
              value={search}
              onChange={e => { setSearch(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
            {/* SEARCH DROPDOWN */}
            {showResults && search && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#292524] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto" onMouseLeave={() => setShowResults(false)}>
                {searchResults.length > 0 ? (
                  searchResults.map(s => {
                    const isAdded = activeWatchlist.has(s.symbol);
                    return (
                      <div key={s.symbol} onClick={() => !isAdded && onToggleWatchlist(s.symbol)} className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-400 border border-white/5">{s.symbol[0]}</div>
                          <div>
                            <div className="text-sm font-bold text-white">{s.symbol}</div>
                            <div className="text-[10px] text-stone-500">{s.name}</div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleWatchlist(s.symbol); }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAdded ? 'text-emerald-400 bg-emerald-500/10' : 'text-stone-600 hover:text-white hover:bg-white/10'}`}
                        >
                          {isAdded ? '✓' : '+'}
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-stone-500 text-xs">No assets found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TABLE VIEW */}
        {watchlistStocks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
            <div className="text-5xl mb-4 opacity-10">📝</div>
            <p className="font-medium">List "{activeListName}" is empty</p>
            <p className="text-xs mt-1">Use the search bar above to add stocks</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/20 text-[10px] font-bold text-stone-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="p-4 border-b border-white/5">Company Name</th>
                  <th className="p-4 border-b border-white/5 text-right">Price</th>
                  <th className="p-4 border-b border-white/5 text-center">1D Change</th>
                  <th className="p-4 border-b border-white/5 w-48">Day Range (Low - High)</th>
                  <th className="p-4 border-b border-white/5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {watchlistStocks.map(stock => {
                  const change = parseFloat(stock.change) || 0;
                  const price = parseFloat(stock.currentPrice) || 0;
                  // Synthetic Day Range Calculation (Since we don't have real day high/low in basic data, we approximate for visuals)
                  // In a real app, use stock.dayLow / stock.dayHigh
                  const rangeLow = price * (1 - Math.abs(change / 100) - 0.01);
                  const rangeHigh = price * (1 + Math.abs(change / 100) + 0.01);
                  const rangePos = ((price - rangeLow) / (rangeHigh - rangeLow)) * 100;

                  return (
                    <tr key={stock.symbol} onClick={() => onStockClick(stock)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-stone-800 to-black border border-white/10 flex items-center justify-center font-bold text-[10px] text-stone-400">{stock.symbol.slice(0, 1)}</div>
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{stock.symbol}</div>
                            <div className="text-xs text-stone-500">{stock.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-stone-200 font-medium">₹{stock.currentPrice}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
                          <span>{rangeLow.toFixed(0)}</span>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                            <div className="absolute top-0 bottom-0 w-2 h-full bg-stone-300 rounded-full shadow-[0_0_5px_white]" style={{ left: `${Math.min(95, Math.max(0, rangePos))}%` }}></div>
                          </div>
                          <span>{rangeHigh.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onToggleWatchlist(stock.symbol)} className="text-stone-600 hover:text-red-400 transition-colors" title="Remove">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ===========================
// MOBILE BOTTOM NAVIGATION
// ===========================
function MobileBottomNav({ activeMode, onSwitch }) {
  const items = [
    { id: 'snapshot', label: 'Snapshot', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'timeline', label: 'Timeline', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'watchlist', label: 'Watchlist', icon: 'M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h14v14H5V5zm6 4a1 1 0 100-2 1 1 0 000 2zm0 6a1 1 0 100-2 1 1 0 000 2zm4-6a1 1 0 100-2 1 1 0 000 2zm4 6a1 1 0 100 2 1 1 0 000-2z' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161413] border-t border-white/10 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onSwitch(item.id)}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 transition-transform ${activeMode === item.id ? 'text-emerald-400' : 'text-stone-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeMode === item.id ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
          </svg>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ===========================
// MAIN APP
// ===========================
function App() {
  // Feature Flags - Moved to top for correct state initialization
  const marqueeEnabled = useFeatureFlag('marquee');
  const dailySnapshotEnabled = useFeatureFlag('dailySnapshot');
  const watchlistEnabled = useFeatureFlag('watchlist');
  const marketTimelineEnabled = useFeatureFlag('marketTimeline');

  // Sub-feature flags for adaptive UI
  const dailySnapshotSectorsEnabled = useFeatureFlag('dailySnapshot_sectors');
  const dailySnapshotEquitiesEnabled = useFeatureFlag('dailySnapshot_equities');
  const dailySnapshotAnalyticsEnabled = useFeatureFlag('dailySnapshot_analytics');

  // Logic for adaptive mode switcher
  const enabledModes = useMemo(() => {
    const modes = [];
    if (dailySnapshotEnabled) modes.push('snapshot');
    if (marketTimelineEnabled) modes.push('timeline');
    if (watchlistEnabled) modes.push('watchlist');
    return modes;
  }, [dailySnapshotEnabled, marketTimelineEnabled, watchlistEnabled]);

  const isTimelineOnly = enabledModes.length === 1 && enabledModes[0] === 'timeline';

  // Logic for adaptive sub-navigation (Daily Snapshot)
  const enabledSnapshotTabs = useMemo(() => {
    const tabs = [];
    if (dailySnapshotSectorsEnabled) tabs.push('Sectors');
    if (dailySnapshotEquitiesEnabled) tabs.push('Equities');
    if (dailySnapshotAnalyticsEnabled) tabs.push('Analytics');
    return tabs;
  }, [dailySnapshotSectorsEnabled, dailySnapshotEquitiesEnabled, dailySnapshotAnalyticsEnabled]);

  const [stocks, setStocks] = useState({});
  const [categories, setCategories] = useState({});
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('analytics');
  const [stats, setStats] = useState({ total: 0, gainers: 0, losers: 0 });

  // Multi-list Watchlist State
  const [watchlists, setWatchlists] = useState(() => {
    const saved = localStorage.getItem('gaia_watchlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert arrays back to Sets
        const restored = {};
        Object.keys(parsed).forEach(k => restored[k] = new Set(parsed[k]));
        return restored;
      } catch (e) { console.error(e); }
    }
    return { 'Equity': new Set() }; // Default list
  });
  const [activeListName, setActiveListName] = useState('Equity');

  // Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState(false);

  // State for app mode (snapshot or timeline) - Initialize with logic to prevent flicker
  const [appMode, setAppMode] = useState(() => {
    if (enabledModes.includes('snapshot')) return 'snapshot';
    return enabledModes[0] || 'snapshot';
  });

  // State for active tab in snapshot mode - Initialize with logic
  const [activeTab, setActiveTab] = useState(() => {
    if (enabledSnapshotTabs.includes('Sectors')) return 'Sectors';
    return enabledSnapshotTabs[0] || 'Sectors';
  });

  // State for last updated time
  const [lastUpdated, setLastUpdated] = useState('');



  // Auto-correction Effect: Ensure current mode and tab are valid
  useEffect(() => {
    // 1. Correct appMode
    if (enabledModes.length > 0 && !enabledModes.includes(appMode)) {
      setAppMode(enabledModes[0]);
    }

    // 2. Correct activeTab (Snapshot)
    if (appMode === 'snapshot' && enabledSnapshotTabs.length > 0 && !enabledSnapshotTabs.includes(activeTab)) {
      setActiveTab(enabledSnapshotTabs[0]);
    }
  }, [appMode, activeTab, enabledModes, enabledSnapshotTabs]);

  // Persist on change
  useEffect(() => {
    const toSave = {};
    Object.keys(watchlists).forEach(k => toSave[k] = Array.from(watchlists[k]));
    localStorage.setItem('gaia_watchlists', JSON.stringify(toSave));
  }, [watchlists]);

  // Keyboard shortcut removed as per request
  /*
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAdminMode(prev => !prev);
      }
    };

      window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
      */

  const toggleWatchlist = (symbol) => {
    setWatchlists(prev => {
      const next = { ...prev };
      const currentSet = new Set(next[activeListName] || []);
      if (currentSet.has(symbol)) currentSet.delete(symbol);
      else currentSet.add(symbol);
      next[activeListName] = currentSet;
      return next;
    });
  };

  const createWatchlist = () => {
    const name = prompt("Enter new list name:");
    if (name && name.trim()) {
      if (watchlists[name]) {
        alert("List already exists!");
        return;
      }
      setWatchlists(prev => ({ ...prev, [name]: new Set() }));
      setActiveListName(name);
    }
  };

  const deleteWatchlist = (name, e) => {
    e.stopPropagation();
    if (name === 'Equity') return; // Prevent deleting default
    if (confirm(`Delete list "${name}"?`)) {
      setWatchlists(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (activeListName === name) setActiveListName('Equity');
    }
  };

  // Helper to check if current stock is in ACTIVE list
  const isWatchlisted = (symbol) => {
    return watchlists[activeListName]?.has(symbol) || false;
  };

  useEffect(() => {
    // Add cache buster to ensure we always get the latest available dates
    const url = API_BASE_URL === '/api'
      ? `${API_BASE_URL}/dates.json?v=${Date.now()}`
      : `${API_BASE_URL}/dates.json`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error("Response was not JSON (likely HTML 404)");
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.data.length > 0) {
          setDates(data.data);
          setSelectedDate(data.data[0]);
        }
      })
      .catch(err => {
        console.error("Failed to load dates.json:", err);
      });
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // In production static environment, we don't have per-date stock/category snapshots available as individual files.
        // We fallback to checking indices-snapshot.json or indices-timeline.json for the active data.
        // For the main table view, we'll try to load indices-snapshot.json

        let stockUrl = `${API_BASE_URL}/stocks.json`;
        let catUrl = `${API_BASE_URL}/categories.json`;

        // Check if we are in production static mode
        if (API_BASE_URL === '/api') {
          // Mapping to what we actually have in export-static.js
          stockUrl = `${API_BASE_URL}/indices-snapshot.json`; // Fallback for indices
          catUrl = `${API_BASE_URL}/indices-snapshot.json`;  // Fallback
        } else {
          const dateQuery = selectedDate ? `?date=${selectedDate}` : '';
          stockUrl = `${API_BASE_URL}/stocks${dateQuery}`;
          catUrl = `${API_BASE_URL}/categories${dateQuery}`;
        }

        const v = API_BASE_URL === '/api' ? `?v=${Date.now()}` : '';
        const [stockRes, catRes] = await Promise.all([
          fetch(`${stockUrl}${v}`),
          fetch(`${catUrl}${v}`)
        ]);

        const decodeSafe = async (res, name) => {
          if (!res.ok) throw new Error(`${name} fetch failed: ${res.status}`);
          const contentType = res.headers.get("content-type");
          if (!contentType || contentType.indexOf("application/json") === -1) {
            throw new Error(`${name} response is not JSON`);
          }
          return await res.json();
        };

        const stockData = await decodeSafe(stockRes, "Stocks");
        const catData = await decodeSafe(catRes, "Categories");

        if (stockData.success) {
          // Note: If using indices-snapshot, data is in .data
          setStocks(stockData.data || {});
          setCategories(catData.data || {});
        } else {
          setStocks({});
          setCategories({});
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setStocks({});
        setCategories({});
        setLoading(false);
      }
    }

    if (selectedDate) {
      loadData();
    }
  }, [selectedDate]);

  // Available dates for the dropdown (assuming `dates` state is populated)
  const availableDates = dates;

  // Handle stock click for modal
  const handleStockClick = (stock) => {
    setSelectedStock(stock);
  };

  // Derived Stats (moved outside the conditional render to be always available)
  const marketStats = useMemo(() => {
    const list = Object.values(stocks);
    if (!list.length) return { gainers: 0, decliners: 0, vol: '0' };
    const gainers = list.filter(s => parseFloat(s.change) > 0).length;
    return {
      gainers,
      decliners: list.length - gainers,
      vol: (list.reduce((sum, s) => sum + (s.volume || 0), 0) / 10000000).toFixed(1) + 'Cr'
    };
  }, [stocks]);

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-[family-name:var(--font-body)] selection:bg-[var(--accent)]/30 flex flex-col">

      {/* RESTORED HEADER */}
      <header className="h-14 md:h-16 flex flex-none items-center justify-between px-4 md:px-6 bg-[var(--surface-base)] border-b border-[var(--border-subtle)] z-50 transition-all">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group transition-transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white w-5 h-5 md:w-6 md:h-6 relative z-10">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <div className="absolute inset-0 bg-white/10 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] font-bold text-lg md:text-xl tracking-tight text-white leading-none">BHAVCOPY<span className="text-[var(--accent)]">.live</span></span>
              <span className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-0.5 md:mt-1 uppercase">Bazaar Bhav</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Sign In Removed */}
        </div>
      </header>

      {/* SUB-NAVIGATION (Adapt for Mobile) */}
      {
        appMode === 'snapshot' && dailySnapshotEnabled && enabledSnapshotTabs.length > 1 && (
          <div className="h-12 md:h-10 border-b border-white/5 bg-[#1c1917]/40 flex items-center gap-2 px-4 md:px-0 md:justify-center overflow-x-auto no-scrollbar mask-linear-fade">
            {enabledSnapshotTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === tab ? 'text-white bg-white/10' : 'text-stone-500 hover:text-stone-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )
      }

      {/* MAIN CONTENT AREA */}
      <main className="p-4 flex-1 overflow-hidden relative pb-20 md:pb-4">
        {appMode === 'timeline' && marketTimelineEnabled ? (
          <TimelineView onStockClick={handleStockClick} />
        ) : (appMode === 'watchlist' && watchlistEnabled) ? (
          <WatchlistView
            stocks={stocks}
            watchlists={watchlists}
            activeListName={activeListName}
            onSelectList={setActiveListName}
            onCreateList={createWatchlist}
            onDeleteList={deleteWatchlist}
            onStockClick={handleStockClick}
            onToggleWatchlist={toggleWatchlist}
          />
        ) : (
          <div className="h-full">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-stone-500 text-xs tracking-widest uppercase animate-pulse">Syncing Market Data...</p>
              </div>
            ) : (
              <>
                {activeTab === 'Analytics' && dailySnapshotAnalyticsEnabled && <AnalyticsView stocks={stocks} categories={categories} />}
                {activeTab === 'Sectors' && dailySnapshotSectorsEnabled && <SectorView stocks={stocks} categories={categories} onStockClick={handleStockClick} />}
                {activeTab === 'Equities' && dailySnapshotEquitiesEnabled && <TableView stocks={stocks} categories={categories} onStockClick={handleStockClick} />}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-[#0a0e14] py-4 px-6 flex flex-col md:flex-row items-center justify-between text-[10px] text-stone-500 font-medium tracking-wide gap-2">
        <span>Data Updates daily at 8PM (Except Indian Market Holidays)</span>
        <div className="flex items-center gap-4">
          <span>Made with ❤️ in India</span>
          <span>© {new Date().getFullYear()} BhavCopy.live™</span>
        </div>
      </footer>

      {/* GLOBAL MODALS */}
      {
        selectedStock && (
          <StockModal
            stock={selectedStock}
            onClose={() => setSelectedStock(null)}
            isWatchlisted={isWatchlisted(selectedStock.symbol)}
            onToggleWatchlist={() => toggleWatchlist(selectedStock.symbol)}
          />
        )
      }

      {/* Admin Panel */}
      {/* Admin Panel Removed */}
      {/* <AdminPanel isOpen={isAdminMode} onClose={() => setIsAdminMode(false)} /> */}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav activeMode={appMode} onSwitch={setAppMode} />
    </div >
  );
}

export default App;
