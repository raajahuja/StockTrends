const fs = require('fs');
const path = require('path');
const {
    getIndicesSnapshot,
    getIndicesTimeline,
    getTimelineData,
    getAllDates,
    getStats
} = require('./db');

const EXPORT_DIR = path.join(__dirname, 'web', 'public', 'api');

// Create directory if it doesn't exist
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function exportStatic() {
    console.log('🚀 Starting Static JSON Export...');

    try {
        // 1. Export Dates
        console.log('📅 Exporting dates...');
        const dates = getAllDates.all().map(d => d.date);
        fs.writeFileSync(path.join(EXPORT_DIR, 'dates.json'), JSON.stringify({ success: true, data: dates }));

        // 2. Export Stats
        console.log('📊 Exporting stats...');
        const stats = getStats.get();
        fs.writeFileSync(path.join(EXPORT_DIR, 'stats.json'), JSON.stringify({ success: true, ...stats }));

        // 3. Export Indices Snapshot
        console.log('📸 Exporting indices snapshot...');
        const snapshot = getIndicesSnapshot();
        fs.writeFileSync(path.join(EXPORT_DIR, 'indices-snapshot.json'), JSON.stringify({ success: true, data: snapshot }));

        // 4. Export Indices Timeline (ALL HISTORY)
        // We fetching 5000 days to ensure we get everything back to 2014
        console.log('📈 Exporting indices timeline (all history)...');
        const indicesTimeline = getIndicesTimeline(5000, 0);
        fs.writeFileSync(path.join(EXPORT_DIR, 'indices-timeline.json'), JSON.stringify({ success: true, data: indicesTimeline }));

        // 5. Export Stocks Timeline (ALL HISTORY)
        console.log('🏢 Exporting stocks timeline (all history)...');
        const stocksTimeline = getTimelineData(5000, 0);
        fs.writeFileSync(path.join(EXPORT_DIR, 'stocks-timeline.json'), JSON.stringify({ success: true, data: stocksTimeline }));

        console.log(`✅ Export complete! Files saved to: ${EXPORT_DIR}`);
    } catch (err) {
        console.error('❌ Export failed:', err);
    }
}

exportStatic();
