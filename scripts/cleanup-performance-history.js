#!/usr/bin/env node

/**
 * Performance History Cleanup Script
 * Keeps last 6 months of performance data, archives older data
 */

const fs = require('fs');
const path = require('path');

const HISTORY_DIR = '.performance-history';
const ARCHIVE_DIR = '.performance-history-archive';
const RETENTION_DAYS = 180; // 6 months

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function cleanupEnvironment(environment) {
  const historyFile = path.join(HISTORY_DIR, `performance-${environment}.json`);

  if (!fs.existsSync(historyFile)) {
    console.log(`⏭️  No history file found for ${environment}`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    if (!Array.isArray(data)) {
      console.log(`⚠️  Invalid data format for ${environment}`);
      return;
    }

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const recent = [];
    const archived = [];

    data.forEach(measurement => {
      const measDate = new Date(measurement.timestamp);
      if (measDate >= cutoffDate) {
        recent.push(measurement);
      } else {
        archived.push(measurement);
      }
    });

    // Write recent data back
    if (recent.length > 0) {
      fs.writeFileSync(historyFile, JSON.stringify(recent, null, 2));
      console.log(`✅ ${environment}: Kept ${recent.length} recent measurements`);
    } else {
      fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
      console.log(`⚠️  ${environment}: No recent measurements found`);
    }

    // Archive old data if any
    if (archived.length > 0) {
      const archiveDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const archiveFile = path.join(
        ARCHIVE_DIR,
        `performance-${environment}-archived-before-${archiveDate}.json`
      );

      fs.writeFileSync(archiveFile, JSON.stringify(archived, null, 2));
      console.log(`📦 ${environment}: Archived ${archived.length} old measurements to ${path.basename(archiveFile)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${environment}:`, error.message);
  }
}

async function main() {
  console.log('🧹 Starting performance history cleanup...\n');

  ensureDir(HISTORY_DIR);
  ensureDir(ARCHIVE_DIR);

  console.log(`📅 Retention period: Last ${RETENTION_DAYS} days (6 months)\n`);

  cleanupEnvironment('staging');
  cleanupEnvironment('production');

  console.log('\n✨ Cleanup complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
