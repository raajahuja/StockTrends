const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

const TARGET_DIR = path.join(__dirname, 'indices_data');

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Download a single file
async function downloadFile(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    // Directory structure: indices_data/YYYY/MM/
    const yearDir = path.join(TARGET_DIR, String(year));
    const monthDir = path.join(yearDir, month);

    if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
    }

    // Filename format: ind_close_all_DDMMYYYY.csv
    const filename = `ind_close_all_${day}${month}${year}.csv`;
    const url = `https://nsearchives.nseindia.com/content/indices/${filename}`;
    const filePath = path.join(monthDir, filename);

    if (fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${filename} (Already exists in ${year}/${month})`);
        return;
    }

    try {
        console.log(`⬇️  Downloading ${filename} to ${year}/${month}...`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            if (res.status === 404) {
                // Silent fail for 404s (holidays/weekends)
            } else {
                console.error(`❌ Failed to download ${filename}: ${res.status}`);
            }
            return;
        }

        const fileStream = fs.createWriteStream(filePath);
        await finished(Readable.fromWeb(res.body).pipe(fileStream));
        console.log(`✅ Saved ${filename}`);

    } catch (err) {
        console.error(`❌ Error downloading ${filename}:`, err.message);
    }
}

// Helper: Process a range of dates
async function processDateRange(startDate, endDate) {
    // Create new Date loop to avoid reference issues
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        // Optional: Skip weekends if you are sure
        // if (day === 0 || day === 6) continue;

        await downloadFile(new Date(d));
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 150));
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('❌ Usage:');
        console.log('   node download-indices.js MM-YYYY   (e.g., 12-2025)');
        console.log('   node download-indices.js YYYY      (e.g., 2025)');
        return;
    }

    const input = args[0] || 'auto';
    let start, end;

    if (input === 'auto') {
        const now = new Date();
        const year = now.getFullYear();
        console.log(`🚀 AUTO MODE: Starting download for current year: ${year}...`);
        start = new Date(year, 0, 1);
        end = now; // Only up to today
    } else {
        // Check for MM-YYYY format
        const mmYyyyMatch = input.match(/^(\d{1,2})-(\d{4})$/);
        // Check for YYYY format
        const yyyyMatch = input.match(/^(\d{4})$/);

        if (mmYyyyMatch) {
            const month = parseInt(mmYyyyMatch[1], 10);
            const year = parseInt(mmYyyyMatch[2], 10);

            if (month < 1 || month > 12) {
                console.error('❌ Invalid month. Use 1-12.');
                return;
            }

            console.log(`🚀 Starting download for Month: ${month}/${year}...`);
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0); // Last day of month

        } else if (yyyyMatch) {
            const year = parseInt(yyyyMatch[1], 10);
            console.log(`🚀 Starting download for Year: ${year}...`);
            start = new Date(year, 0, 1);     // Jan 1
            end = new Date(year, 11, 31);     // Dec 31

        } else {
            console.error('❌ Invalid format. Use MM-YYYY or YYYY.');
            return;
        }
    }

    await processDateRange(start, end);

    console.log('\n✨ Download process complete!');
    console.log('👉 Run "node sync-indices.js" to import the new data.');
}

main();
