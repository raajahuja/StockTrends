const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'indices_data');

function parseDateFromFilename(filename) {
    // ind_close_all_DDMMYYYY.csv
    const match = filename.match(/ind_close_all_\d{2}(\d{2})(\d{4})\.csv/);
    if (!match) return null;
    return { month: match[1], year: match[2] };
}

if (!fs.existsSync(DATA_DIR)) {
    console.log('No data dir');
    process.exit(0);
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
console.log(`Found ${files.length} files to organize.`);

files.forEach(file => {
    const info = parseDateFromFilename(file);
    if (info) {
        const yearDir = path.join(DATA_DIR, info.year);
        const monthDir = path.join(yearDir, info.month);

        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }

        const oldPath = path.join(DATA_DIR, file);
        const newPath = path.join(monthDir, file);

        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${file} -> ${info.year}/${info.month}/`);
    }
});
console.log('Done organizing.');
