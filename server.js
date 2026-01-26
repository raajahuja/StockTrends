// ===========================
// STOCK TRENDS API SERVER
// ===========================
// Serves stock data from SQLite database (populated from CSV uploads)

const express = require('express');
const cors = require('cors');
const {
    getAllStocks,
    getAllDates,
    getStock,
    getStockHistory,
    getAllSubSectors,
    getStocksBySubSector,
    getTimelineData,
    getIndicesTimeline,
    getIndicesSnapshot,
    getStats
} = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ===========================
// API ROUTES
// ===========================

// Get all available dates
app.get('/api/dates', (req, res) => {
    try {
        const dates = getAllDates.all();
        res.json({
            success: true,
            data: dates.map(d => d.date)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get ALL stocks (optional ?date=YYYY-MM-DD)
app.get('/api/stocks', (req, res) => {
    try {
        const { date } = req.query;
        const stocks = getAllStocks(date);
        const stockMap = {};
        stocks.forEach(s => {
            stockMap[s.symbol] = {
                symbol: s.symbol,
                name: s.name,
                subSector: s.sub_sector,
                currentPrice: s.currentPrice?.toFixed(2) || '0.00',
                change: s.change?.toFixed(2) || '0.00',
                marketCap: s.market_cap
            };
        });
        res.json({
            success: true,
            data: stockMap,
            date: date || 'latest',
            totalStocks: stocks.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get single stock with history
app.get('/api/stocks/:symbol', (req, res) => {
    try {
        const { symbol } = req.params;
        const days = parseInt(req.query.days) || 30;

        const stock = getStock.get(symbol.toUpperCase());
        if (!stock) {
            return res.status(404).json({ success: false, error: 'Stock not found' });
        }

        const history = getStockHistory.all(symbol.toUpperCase(), days);

        res.json({
            success: true,
            data: {
                symbol: stock.symbol,
                name: stock.name,
                subSector: stock.sub_sector,
                currentPrice: stock.currentPrice?.toFixed(2) || '0.00',
                change: stock.change?.toFixed(2) || '0.00',
                monthChange: stock.monthChange?.toFixed(2) || '0.00',
                marketCap: stock.market_cap,
                history: history.map(h => ({
                    date: h.date,
                    close: h.close?.toFixed(2) || '0.00',
                    change: h.change?.toFixed(2) || '0.00'
                })).reverse()
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all categories (optional ?date=YYYY-MM-DD)
app.get('/api/categories', (req, res) => {
    try {
        const { date } = req.query;
        const sectors = getAllSubSectors.all();
        const categories = {};

        // Emoji map for categories
        const getEmoji = (sector) => {
            const map = {
                'Bank': '🏦', 'IT': '💻', 'Pharma': '💊', 'Power': '⚡',
                'Oil': '⛽', 'Insurance': '🛡️', 'Finance': '💰', 'Real Estate': '🏢',
                'Steel': '🔩', 'Hotel': '🏨', 'Hospital': '🏥', 'Telecom': '📱',
                'Cement': '🏗️', 'Auto': '⚙️', 'FMCG': '🛒', 'Retail': '🛍️'
            };
            for (const [key, emoji] of Object.entries(map)) {
                if (sector.includes(key)) return emoji;
            }
            return '📈';
        };

        // Note: getStocksBySubSector now accepts date
        for (const s of sectors) {
            const key = s.sub_sector.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/__+/g, '_');
            const stocks = getStocksBySubSector(s.sub_sector, date);
            categories[key] = {
                name: `${getEmoji(s.sub_sector)} ${s.sub_sector}`,
                stocks: stocks.map(st => st.symbol),
                count: s.count
            };
        }

        res.json({
            success: true,
            data: categories,
            date: date || 'latest',
            totalCategories: sectors.length
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Timeline Data (Matrix)
app.get('/api/timeline', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 15;
        const offset = parseInt(req.query.offset) || 0;
        const result = getTimelineData(days, offset);
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Indices Snapshot (52W Highs)
app.get('/api/indices/snapshot', (req, res) => {
    try {
        const data = getIndicesSnapshot();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Indices Timeline Data
app.get('/api/indices/timeline', (req, res) => {
    try {
        const days = parseInt(req.query.days) || 15;
        const offset = parseInt(req.query.offset) || 0;
        const result = getIndicesTimeline(days, offset);
        res.json({
            success: true,
            data: result
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Health check with stats
app.get('/api/health', (req, res) => {
    try {
        const stats = getStats.get();
        res.json({
            status: 'ok',
            ...stats,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    const stats = getStats.get();
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         📈 StockTrends API Server (SQLite)                   ║
╚══════════════════════════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}
📦 Database: ${stats.totalStocks || 0} stocks, ${stats.totalCategories || 0} categories
📅 Data range: ${stats.firstDate || 'N/A'} to ${stats.lastDate || 'N/A'}
📊 Days of history: ${stats.totalDays || 0}

📊 Endpoints:
   GET /api/dates            - List of available dates
   GET /api/stocks           - All stocks (?date=YYYY-MM-DD)
   GET /api/stocks/:symbol   - Single stock + history
   GET /api/categories       - All categories (?date=YYYY-MM-DD)
   GET /api/health           - Health check + stats

💡 To add data:
   1. Copy CSV to data/csv folder
   2. Run: node sync-csv.js
`);
});
