const fs = require('fs');
const path = require('path');
const { insertIndexData, db } = require('./db');
const indexCategories = require('./index-categories');

// Directory to process
const DATA_DIR = path.join(__dirname, 'indices_data');

// Simple CSV parser
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

function parseDateFromFilename(filename) {
    // Expected format: ind_close_all_DDMMYYYY.csv
    // Regex to capture DDMMYYYY
    const match = filename.match(/ind_close_all_(\d{2})(\d{2})(\d{4})\.csv/);
    if (!match) return null;

    const [_, day, month, year] = match;
    return `${year}-${month}-${day}`;
}

function parseNum(val) {
    if (!val || val === '-') return 0;
    return parseFloat(val);
}

function getCategory(name) {
    return indexCategories[name] || 'Other';
}

// Scan latest year files to build whitelist
function scanForActiveIndices(files) {
    const years = files.map(f => {
        const match = f.match(/indices_data[\\\/](\d{4})/);
        return match ? parseInt(match[1]) : 0;
    });
    const latestYear = Math.max(...years);

    if (latestYear === 0) {
        console.warn('⚠️  No year folders found in indices_data.');
        return new Set();
    }

    console.log(`🔍 Scanning ${latestYear} files for valid indices...`);

    const validIndices = new Set();
    const filesLatest = files.filter(f => f.includes(String(latestYear)));

    if (filesLatest.length === 0) {
        console.warn(`⚠️  No ${latestYear} files found. Filtering might result in 0 indices.`);
        return validIndices;
    }

    filesLatest.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Assuming first line is header
        if (lines.length < 2) return;

        // Parse header to find 'Index Name' column
        const header = parseCSVLine(lines[0]);
        const nameIdx = header.indexOf('Index Name');

        if (nameIdx === -1) return;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = parseCSVLine(line);
            const name = cols[nameIdx];
            if (name) validIndices.add(name);
        }
    });

    console.log(`✅ Found ${validIndices.size} active indices in 2026.`);
    return validIndices;
}

function processFile(filePath, fileName, validIndices) {
    console.log(`Processing ${fileName}...`);

    const fileDate = parseDateFromFilename(fileName);
    if (!fileDate) {
        console.error(`⚠️  Skipping ${fileName}: Date not found in filename.`);
        return 0;
    }
    // console.log(`📅 Date detected: ${fileDate}`); // Reduce noise

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length < 2) return 0;

    const header = parseCSVLine(lines[0]);
    const colIndex = {};
    header.forEach((col, idx) => colIndex[col] = idx);

    const insert = db.transaction(() => {
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = parseCSVLine(line);

            try {
                const name = cols[colIndex['Index Name']];

                // FILTER: Only insert if in 2026 whitelist
                if (!validIndices.has(name)) {
                    // console.log(`Skipping defunct index: ${name}`);
                    continue;
                }

                const date = fileDate;
                const category = getCategory(name);

                if (!name || !date) continue;

                insertIndexData.run(
                    name,
                    date,
                    category,
                    parseNum(cols[colIndex['Open Index Value']]),
                    parseNum(cols[colIndex['High Index Value']]),
                    parseNum(cols[colIndex['Low Index Value']]),
                    parseNum(cols[colIndex['Closing Index Value']]),
                    parseNum(cols[colIndex['Points Change']]),
                    parseNum(cols[colIndex['Change(%)']]),
                    parseNum(cols[colIndex['Volume']]),
                    parseNum(cols[colIndex['Turnover (Rs. Cr.)']]),
                    parseNum(cols[colIndex['P/E']]),
                    parseNum(cols[colIndex['P/B']]),
                    parseNum(cols[colIndex['Div Yield']])
                );
                count++;
            } catch (err) {
                console.error(`Error processing line ${i}:`, err.message);
            }
        }
        return count;
    });

    const inserted = insert();
    // console.log(`✅ Imported ${inserted} records.`);
    return inserted;
}

// Recursive function to get all files
function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
        } else {
            if (file.toLowerCase().endsWith('.csv')) {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        }
    });

    return arrayOfFiles;
}

function main() {
    if (!fs.existsSync(DATA_DIR)) {
        console.error(`❌ Directory not found: ${DATA_DIR}`);
        return;
    }

    // Get all CSV files recursively
    let files = getAllFiles(DATA_DIR);

    if (files.length === 0) {
        console.log(`No CSV files found in ${DATA_DIR}`);
        return;
    }

    // Sort files by date
    files.sort((a, b) => {
        const dateA = parseDateFromFilename(path.basename(a));
        const dateB = parseDateFromFilename(path.basename(b));
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
    });

    console.log(`Found ${files.length} CSV files to process.`);

    // 1. CLEAR TABLE
    console.log('🗑️  Clearing existing indices data to ensure pure sync...');
    db.prepare('DELETE FROM indices').run();

    // 2. SCAN FOR ACTIVE INDICES (Based on latest year folder)
    const validIndices = scanForActiveIndices(files);

    let totalInserted = 0;
    for (const filePath of files) {
        const fileName = path.basename(filePath);
        totalInserted += processFile(filePath, fileName, validIndices);
    }

    console.log(`\n🎉 All done! Total records imported: ${totalInserted}`);
    console.log(`(Indices filtered to only those present in the latest year)`);
}

main();
