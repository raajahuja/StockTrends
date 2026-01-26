// Script to parse Stock Screener CSV and generate category mapping + stock data
const fs = require('fs');

const csv = fs.readFileSync('./Stock_Screener_25_01_2026.csv', 'utf8');
const lines = csv.split('\n');

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Parse header: Name,Ticker,Sub-Sector,Market Cap,Close Price,PE Ratio,1M Return,1D Return,...
const header = parseCSVLine(lines[0]);
const colIndex = {};
header.forEach((col, idx) => colIndex[col] = idx);

// Build mapping: group stocks by sub-sector + collect stock data
const subsectorStocks = {};
const allStocks = {};

for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 8) {
        const name = cols[colIndex['Name']] || '';
        const ticker = cols[colIndex['Ticker']] || '';
        const subSector = cols[colIndex['Sub-Sector']] || '';
        const marketCap = parseFloat(cols[colIndex['Market Cap']]) || 0;
        const closePrice = parseFloat(cols[colIndex['Close Price']]) || 0;
        const dayReturn = parseFloat(cols[colIndex['1D Return']]) || 0;
        const monthReturn = parseFloat(cols[colIndex['1M Return']]) || 0;

        if (ticker && subSector) {
            // Add to subsector mapping
            if (!subsectorStocks[subSector]) {
                subsectorStocks[subSector] = [];
            }
            subsectorStocks[subSector].push(ticker);

            // Store individual stock data
            allStocks[ticker] = {
                symbol: ticker,
                name: name,
                subSector: subSector,
                currentPrice: closePrice.toFixed(2),
                change: dayReturn.toFixed(2),
                monthChange: monthReturn.toFixed(2),
                marketCap: marketCap
            };
        }
    }
}

// Generate category name with emoji
const emojiMap = {
    'Private Banks': '🏦', 'Public Banks': '🏛️',
    'IT Services': '💻', 'Software': '💻',
    'Pharma': '💊', 'Power': '⚡', 'Renewable': '🌱',
    'Oil': '⛽', 'Insurance': '🛡️', 'Finance': '💰',
    'Real Estate': '🏢', 'Steel': '🔩', 'Hotels': '🏨',
    'Hospital': '🏥', 'Telecom': '📱', 'Cement': '🏗️',
    'Auto': '⚙️', 'Ports': '🚢', 'Airlines': '✈️',
    'FMCG': '🛒', 'Retail': '🛍️', 'default': '📈'
};

function getEmoji(sector) {
    for (const [key, emoji] of Object.entries(emojiMap)) {
        if (sector.toLowerCase().includes(key.toLowerCase())) return emoji;
    }
    return emojiMap['default'];
}

// Create categories output
const categories = {};
Object.entries(subsectorStocks)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([sector, stocks]) => {
        const key = sector.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/__+/g, '_');
        categories[key] = {
            name: `${getEmoji(sector)} ${sector}`,
            stocks: stocks
        };
    });

// Output combined data
const output = {
    categories: categories,
    stocks: allStocks,
    totalStocks: Object.keys(allStocks).length,
    totalCategories: Object.keys(categories).length
};

console.log('// Generated from Stock_Screener_25_01_2026.csv');
console.log('// ' + output.totalStocks + ' stocks in ' + output.totalCategories + ' categories');
console.log('module.exports = ' + JSON.stringify(output, null, 2) + ';');
