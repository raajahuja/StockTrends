#!/usr/bin/env node
// ===========================
// CSV Import Script
// ===========================
// Usage: node import-csv.js [path-to-csv] [date]
// If no date provided, extracts from filename (Stock_Screener_25_01_2026.csv -> 2026-01-25)

const fs = require('fs');
const path = require('path');
const { db, upsertStock, insertDailyData, getStats } = require('./db');

// Parse CSV line handling quoted fields
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

// Extract date from filename like Stock_Screener_25_01_2026.csv
function extractDateFromFilename(filename) {
    const match = filename.match(/(\d{2})_(\d{2})_(\d{4})/);
    if (match) {
        const [, day, month, year] = match;
        return `${year}-${month}-${day}`;
    }
    // Default to today
    return new Date().toISOString().split('T')[0];
}

// Import CSV file
function importCSV(csvPath, forceDate = null) {
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File not found: ${csvPath}`);
        process.exit(1);
    }

    const filename = path.basename(csvPath);
    const date = forceDate || extractDateFromFilename(filename);

    console.log(`📂 Importing: ${filename}`);
    console.log(`📅 Date: ${date}`);

    const csv = fs.readFileSync(csvPath, 'utf8');
    const lines = csv.split('\n');

    // Parse header
    const header = parseCSVLine(lines[0]);
    const colIndex = {};
    header.forEach((col, idx) => colIndex[col] = idx);

    // Validate required columns
    const required = ['Name', 'Ticker', 'Sub-Sector', 'Close Price', '1D Return'];
    for (const col of required) {
        if (colIndex[col] === undefined) {
            console.error(`❌ Missing required column: ${col}`);
            process.exit(1);
        }
    }

    // Import in a transaction for speed
    let imported = 0;
    let errors = 0;

    const importTransaction = db.transaction(() => {
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 5) continue;

            try {
                const ticker = cols[colIndex['Ticker']];
                const name = cols[colIndex['Name']];
                const subSector = cols[colIndex['Sub-Sector']];
                const closePrice = parseFloat(cols[colIndex['Close Price']]) || 0;
                const dayReturn = parseFloat(cols[colIndex['1D Return']]) || 0;
                const monthReturn = parseFloat(cols[colIndex['1M Return']]) || 0;
                const marketCap = parseFloat(cols[colIndex['Market Cap']]) || 0;
                const peRatio = parseFloat(cols[colIndex['PE Ratio']]) || 0;

                if (!ticker) continue;

                // Insert/update stock master
                upsertStock.run(ticker, name, subSector);

                // Insert daily data
                insertDailyData.run(
                    ticker, date, closePrice, dayReturn, monthReturn, marketCap, peRatio, 0
                );

                imported++;
            } catch (err) {
                errors++;
            }
        }
    });

    importTransaction();

    // Show stats
    const stats = getStats.get();
    console.log(`\n✅ Import complete!`);
    console.log(`   📈 Imported: ${imported} stocks`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n📊 Database stats:`);
    console.log(`   Total stocks: ${stats.totalStocks}`);
    console.log(`   Categories: ${stats.totalCategories}`);
    console.log(`   Days of data: ${stats.totalDays}`);
    console.log(`   Date range: ${stats.firstDate} to ${stats.lastDate}`);
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // If no args, look for CSVs in data/csv folder
        const csvDir = path.join(__dirname, 'data', 'csv');
        if (fs.existsSync(csvDir)) {
            const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
            if (files.length > 0) {
                console.log(`📂 Found ${files.length} CSV files in data/csv/`);
                for (const file of files) {
                    importCSV(path.join(csvDir, file));
                }
            } else {
                console.log('📂 No CSV files in data/csv/');
                console.log('Usage: node import-csv.js <path-to-csv> [date]');
            }
        } else {
            console.log('Usage: node import-csv.js <path-to-csv> [date]');
        }
    } else {
        const csvPath = args[0];
        const date = args[1] || null;
        importCSV(csvPath, date);
    }
}

module.exports = { importCSV, parseCSVLine };
