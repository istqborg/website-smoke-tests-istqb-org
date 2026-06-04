# Performance History

This directory contains historical performance measurements across all workflow runs.

- `performance-staging.json` — Staging environment measurements from all runs
- `performance-production.json` — Production environment measurements from all runs

The performance comparison reports average metrics across all historical data to provide more reliable performance trends. Each run performs 3 iterations of the full test suite to reduce variance from network fluctuations.

**Data is automatically maintained by the CI workflow** and should not be manually edited.
