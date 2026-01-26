// ===========================
// SQLite Database Module
// ===========================
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'stocks.db');
const db = new Database(DB_PATH);

// Disable WAL mode for Git stability (otherwise -wal and -shm files conflict)
db.pragma('journal_mode = DELETE');

// ===========================
// IN-MEMORY CACHE (For Static History)
// ===========================
const TIMELINE_CACHE = new Map();
const CACHE_LIMIT = 500; // Prevent memory bloat

const addToCache = (key, value) => {
  if (TIMELINE_CACHE.size >= CACHE_LIMIT) {
    // Simple eviction: remove first key (oldest inserted)
    const firstKey = TIMELINE_CACHE.keys().next().value;
    TIMELINE_CACHE.delete(firstKey);
  }
  TIMELINE_CACHE.set(key, value);
};


// Initialize tables
db.exec(`
  -- Master stock list
  CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    sub_sector TEXT
  );
  
  -- Daily price data (history builds from daily CSV uploads)
  CREATE TABLE IF NOT EXISTS daily_data (
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    close_price REAL,
    day_return REAL,
    month_return REAL,
    market_cap REAL,
    pe_ratio REAL,
    volume REAL,
    PRIMARY KEY (symbol, date)
  );
  
  -- Indices Table
  CREATE TABLE IF NOT EXISTS indices (
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    change_points REAL,
    change_percent REAL,
    volume REAL,
    turnover REAL,
    pe REAL,
    pb REAL,
    div_yield REAL,
    PRIMARY KEY (name, date)
  );
  
  -- Create index for faster history queries
  CREATE INDEX IF NOT EXISTS idx_daily_symbol ON daily_data(symbol);
  CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_data(date);
  CREATE INDEX IF NOT EXISTS idx_indices_name ON indices(name);
  CREATE INDEX IF NOT EXISTS idx_indices_date ON indices(date);
  CREATE INDEX IF NOT EXISTS idx_indices_category ON indices(category);
`);

console.log('📊 Database initialized at:', DB_PATH);

// Insert or update stock master record
const upsertStock = db.prepare(`
  INSERT INTO stocks (symbol, name, sub_sector) 
  VALUES (?, ?, ?)
  ON CONFLICT(symbol) DO UPDATE SET 
    name = excluded.name,
    sub_sector = excluded.sub_sector
`);

// Insert daily data (ignore duplicates)
const insertDailyData = db.prepare(`
  INSERT OR REPLACE INTO daily_data 
  (symbol, date, close_price, day_return, month_return, market_cap, pe_ratio, volume)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insert index data
const insertIndexData = db.prepare(`
  INSERT OR REPLACE INTO indices
  (name, date, category, open, high, low, close, change_points, change_percent, volume, turnover, pe, pb, div_yield)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Get all unique dates

const getAllDates = db.prepare(`
  SELECT DISTINCT date FROM daily_data ORDER BY date DESC
`);

// Get latest date
const getLatestDate = db.prepare(`
  SELECT MAX(date) as date FROM daily_data
`);

// Get all stocks for a specific date (or latest if null)
const getAllStocks = (date = null) => {
  if (!date) {
    const latest = getLatestDate.get();
    date = latest ? latest.date : null;
  }
  if (!date) return [];

  const stmt = db.prepare(`
    SELECT s.symbol, s.name, s.sub_sector, 
           d.close_price as currentPrice, d.day_return as change,
           d.market_cap, d.date
    FROM stocks s
    JOIN daily_data d ON s.symbol = d.symbol
    WHERE d.date = ?
    ORDER BY d.market_cap DESC
  `);
  return stmt.all(date);
};

// Get stock history (last N days)
const getStockHistory = db.prepare(`
  SELECT date, close_price as close, day_return as change
  FROM daily_data
  WHERE symbol = ?
  ORDER BY date DESC
  LIMIT ?
`);

// Get single stock with latest data
const getStock = db.prepare(`
  SELECT s.symbol, s.name, s.sub_sector,
         d.close_price as currentPrice, d.day_return as change,
         d.month_return as monthChange, d.market_cap, d.pe_ratio, d.date
  FROM stocks s
  LEFT JOIN daily_data d ON s.symbol = d.symbol
  WHERE s.symbol = ?
  ORDER BY d.date DESC
  LIMIT 1
`);

// Get all unique sub-sectors with count
const getAllSubSectors = db.prepare(`
  SELECT sub_sector, COUNT(*) as count
  FROM stocks
  WHERE sub_sector IS NOT NULL AND sub_sector != ''
  GROUP BY sub_sector
  ORDER BY count DESC
`);

// Get stocks by sub-sector for a specific date
const getStocksBySubSector = (subSector, date = null) => {
  if (!date) {
    const latest = getLatestDate.get();
    date = latest ? latest.date : null;
  }
  if (!date) return [];

  const stmt = db.prepare(`
    SELECT s.symbol, s.name, d.close_price as currentPrice, d.day_return as change
    FROM stocks s
    JOIN daily_data d ON s.symbol = d.symbol
    WHERE s.sub_sector = ? AND d.date = ?
    ORDER BY d.market_cap DESC
  `);
  return stmt.all(subSector, date);
};

// Get database stats
const getStats = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM stocks) as totalStocks,
    (SELECT COUNT(DISTINCT sub_sector) FROM stocks) as totalCategories,
    (SELECT COUNT(DISTINCT date) FROM daily_data) as totalDays,
    (SELECT MIN(date) FROM daily_data) as firstDate,
    (SELECT MAX(date) FROM daily_data) as lastDate
`);

// Helper to compute Rank Map (Symbol -> Category)
// Based on LATEST available date's Market Cap
const getMarketCapRanks = () => {
  const latestDateRow = getLatestDate.get();
  if (!latestDateRow) return {};

  const stmt = db.prepare(`
     SELECT symbol, market_cap 
     FROM daily_data 
     WHERE date = ? 
     ORDER BY market_cap DESC
   `);

  const rows = stmt.all(latestDateRow.date);
  const rankMap = {};

  rows.forEach((r, index) => {
    const rank = index + 1;
    let category = 'Small Cap';
    if (rank <= 100) category = 'Large Cap';
    else if (rank <= 250) category = 'Mid Cap';

    rankMap[r.symbol] = category;
  });

  return rankMap;
};

// Get Timeline Data (Stocks x Dates) for matrix view
// Returns flattened list: { symbol, sub_sector, date, day_return, close_price }
// We fetch last N dates for ALL stocks clearly
const holidays = require('./holidays');
const dayjs = require('dayjs');

// Helper: Get Continuous Dates (Last N days including weekends/holidays)
const getContinuousDates = (days = 15, offset = 0) => {
  // Get the absolute latest date available in either table to start from
  // If no data, fallback to today
  const latestDaily = getLatestDate.get();

  // Also check indices for latest date just in case
  const latestIndex = db.prepare('SELECT MAX(date) as date FROM indices').get();

  let lastDateStr = latestDaily?.date || latestIndex?.date || new Date().toISOString().split('T')[0];

  // Generate dates going backwards
  const result = [];
  let current = dayjs(lastDateStr).subtract(offset, 'day'); // Start from offset

  for (let i = 0; i < days; i++) {
    const dateStr = current.format('YYYY-MM-DD');
    const dayOfWeek = current.day(); // 0=Sun, 6=Sat

    let isClosed = false;
    let reason = '';

    // Check Weekend
    if (dayOfWeek === 0) { isClosed = true; reason = 'Sunday'; }
    else if (dayOfWeek === 6) { isClosed = true; reason = 'Saturday'; }

    // Check Holiday
    if (holidays[dateStr]) {
      isClosed = true;
      reason = holidays[dateStr];
    }

    result.push({ date: dateStr, isClosed, reason });
    current = current.subtract(1, 'day');
  }

  return result; // List of objects { date, isClosed, reason }
};

// Get Timeline Data (Stocks x Dates) for matrix view
const getTimelineData = (days = 15, offset = 0) => {
  // Check Cache for Historical Data (offset > 0)
  if (offset > 0) {
    const cacheKey = `STOCK_TIMELINE_${days}_${offset}`;
    if (TIMELINE_CACHE.has(cacheKey)) {
      return TIMELINE_CACHE.get(cacheKey);
    }
  }

  // 1. Get Continuous Dates
  const dateObjs = getContinuousDates(days, offset);
  const dateStrings = dateObjs.map(d => d.date);

  if (dateStrings.length === 0) return { dates: [], data: [], dateInfo: {} };

  // 2. Get Ranks
  const rankMap = getMarketCapRanks();

  // 3. Build Query
  const placeholders = dateStrings.map(() => '?').join(',');

  const stmt = db.prepare(`
    SELECT s.symbol, s.name, s.sub_sector, d.date, d.day_return, d.market_cap
    FROM stocks s
    JOIN daily_data d ON s.symbol = d.symbol
    WHERE d.date IN (${placeholders})
    ORDER BY s.sub_sector, s.symbol, d.date DESC
  `);

  const rows = stmt.all(...dateStrings);

  // 4. Inject Cap Category
  const enrichedRows = rows.map(r => ({
    ...r,
    cap_category: rankMap[r.symbol] || 'Small Cap'
  }));

  // Create a map for date info to send to frontend
  const dateInfo = {};
  dateObjs.forEach(d => dateInfo[d.date] = d);

  const result = { dates: dateStrings, data: enrichedRows, dateInfo };

  // Cache Result if Historical (offset > 0)
  if (offset > 0) {
    const cacheKey = `STOCK_TIMELINE_${days}_${offset}`;
    addToCache(cacheKey, result);
  }

  return result;
};

// Get indices timeline (Matrix)
const getIndicesTimeline = (days = 15, offset = 0) => {
  // Check Cache for Historical Data (offset > 0)
  if (offset > 0) {
    const cacheKey = `INDICES_TIMELINE_${days}_${offset}`;
    if (TIMELINE_CACHE.has(cacheKey)) {
      return TIMELINE_CACHE.get(cacheKey);
    }
  }

  // 1. Get Continuous Dates
  const dateObjs = getContinuousDates(days, offset);
  const dateStrings = dateObjs.map(d => d.date);

  if (dateStrings.length === 0) return { dates: [], data: [], dateInfo: {} };

  const placeholders = dateStrings.map(() => '?').join(',');

  const stmt = db.prepare(`
    SELECT name, date, category, open, high, low, close, change_points, change_percent, volume, turnover, pe, pb, div_yield
    FROM indices
    WHERE date IN (${placeholders})
    ORDER BY name, date DESC
  `);

  // Create a map for date info to send to frontend
  const dateInfo = {};
  dateObjs.forEach(d => dateInfo[d.date] = d);

  const result = { dates: dateStrings, data: stmt.all(...dateStrings), dateInfo };

  // Cache Result if Historical (offset > 0)
  if (offset > 0) {
    const cacheKey = `INDICES_TIMELINE_${days}_${offset}`;
    addToCache(cacheKey, result);
  }

  return result;
};

// Get all stocks for a specific date (or latest if null)
// Modified to include cap_category if needed (optional)
// But strict requirement was Timeline. 

// Get Market Snapshot (52W High, Drawdowns)
// We look back 365 days from the latest available date in DB.
const getIndicesSnapshot = () => {
  // 1. Find the latest date in the database
  const latestDateRow = db.prepare('SELECT MAX(date) as maxDate FROM indices').get();
  const maxDate = latestDateRow ? latestDateRow.maxDate : null;

  if (!maxDate) return [];

  // 2. Calculate 52-week start date (approx 365 days ago)
  // We can let SQLite handle date calculation or do it in JS. SQLite: date('now', '-1 year')
  // But strictly using maxDate from DB is better for static datasets.

  const stmt = db.prepare(`
    WITH Stats AS (
      SELECT 
        name, 
        MAX(high) as fiftyTwoWeekHigh,
        MIN(low) as fiftyTwoWeekLow
      FROM indices 
      WHERE date >= date(?, '-365 days')
      GROUP BY name
    ),
    Latest AS (
      SELECT name, close as currentClose, category
      FROM indices
      WHERE date = ?
    )
    SELECT 
      l.name, 
      l.category,
      l.currentClose,
      s.fiftyTwoWeekHigh,
      s.fiftyTwoWeekLow
    FROM Latest l
    JOIN Stats s ON l.name = s.name
    ORDER BY l.category, l.name
  `);

  const rows = stmt.all(maxDate, maxDate);

  // 3. Process in JS to add computed fields
  return rows.map(r => {
    const fall = ((r.currentClose - r.fiftyTwoWeekHigh) / r.fiftyTwoWeekHigh) * 100;
    return {
      ...r,
      fallPercent: fall, // e.g. -12.5
      level10: r.fiftyTwoWeekHigh * 0.90,
      level15: r.fiftyTwoWeekHigh * 0.85,
      level20: r.fiftyTwoWeekHigh * 0.80,
      level25: r.fiftyTwoWeekHigh * 0.75
    };
  });
};

module.exports = {
  db,
  upsertStock,
  insertDailyData,
  getAllStocks,
  getAllDates,
  getStockHistory,
  getStock,
  getAllSubSectors,
  getStocksBySubSector,
  getTimelineData,
  getIndicesTimeline,
  insertIndexData,
  getStats,
  getIndicesSnapshot
};
