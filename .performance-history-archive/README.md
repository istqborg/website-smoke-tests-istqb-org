# Performance History Archive

This directory contains archived performance measurements older than 6 months.

Data is automatically rotated here by the `cleanup-performance-history.js` script which runs as part of the CI workflow. Old measurements are preserved for historical reference but not used in current performance comparisons.

**Files:**
- `performance-[environment]-archived-before-YYYY-MM-DD.json` — Measurements from before the specified date

**Structure:** Each archive file contains an array of measurement objects with timestamps, page names, and metrics.

To restore archived data, simply move files back to `.performance-history/` directory.
