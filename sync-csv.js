#!/usr/bin/env node
// ===========================
// CSV Folder Sync Script
// ===========================
// Watches data/csv folder and imports any new CSV files
// Also imports all existing files on startup

const fs = require('fs');
const path = require('path');
const { importCSV } = require('./import-csv');

const CSV_DIR = path.join(__dirname, 'data', 'csv');
const PROCESSED_FILE = path.join(__dirname, 'data', '.processed');

// Track which files have been processed
function getProcessedFiles() {
    if (fs.existsSync(PROCESSED_FILE)) {
        return new Set(fs.readFileSync(PROCESSED_FILE, 'utf8').split('\n').filter(Boolean));
    }
    return new Set();
}

function markProcessed(filename) {
    fs.appendFileSync(PROCESSED_FILE, filename + '\n');
}

// Import all unprocessed CSVs
function syncAllCSVs() {
    if (!fs.existsSync(CSV_DIR)) {
        fs.mkdirSync(CSV_DIR, { recursive: true });
        console.log(`📂 Created folder: ${CSV_DIR}`);
        return;
    }

    const processed = getProcessedFiles();
    const files = fs.readdirSync(CSV_DIR)
        .filter(f => f.endsWith('.csv'))
        .sort(); // Process in order (oldest first)

    let newFiles = 0;

    for (const file of files) {
        if (!processed.has(file)) {
            console.log(`\n🆕 New file: ${file}`);
            try {
                importCSV(path.join(CSV_DIR, file));
                markProcessed(file);
                newFiles++;
            } catch (err) {
                console.error(`❌ Error importing ${file}:`, err.message);
            }
        }
    }

    if (newFiles === 0) {
        console.log('✅ All CSV files already processed');
    } else {
        console.log(`\n✅ Processed ${newFiles} new files`);
    }
}

// CLI entry point
if (require.main === module) {
    console.log(`
╔════════════════════════════════════════════╗
║       📂 Stock Data CSV Sync               ║
╚════════════════════════════════════════════╝
  
📁 Folder: ${CSV_DIR}
`);

    syncAllCSVs();

    console.log(`
💡 To add new data:
   1. Copy Stock_Screener_XX_XX_XXXX.csv to data/csv/
   2. Run: node sync-csv.js
`);
}

module.exports = { syncAllCSVs };
