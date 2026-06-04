# ISTQB.org Smoke Tests with Performance Comparison

Cypress-based end-to-end smoke tests for ISTQB.org with performance comparison between staging and production environments.

## Features

- ✅ Automated smoke tests for critical user journeys
- 📊 Performance measurement and comparison
- 🔄 Dual environment testing (Staging & Production)
- 📈 Automated performance reports
- 🤖 GitHub Actions CI/CD integration
- 📝 PDF validation for downloadable content

## Environments

- **Staging**: `http://54.246.123.236`
- **Production**: `https://istqb.org`

## Test Coverage

The smoke tests validate:
1. Landing page accessibility and content
2. Navigation to Certifications page
3. CTFL (Certified Tester Foundation Level) v4.0 details page
4. PDF syllabus download functionality and validation
5. Page load performance metrics

## Installation

```bash
npm install
```

## Running Tests Locally

### Run All Tests (Staging + Production + Comparison)
```bash
npm test
```

### Run Individual Test Suites
```bash
# Staging environment only
npm run test:staging

# Production environment only
npm run test:production

# Performance comparison only (requires previous test results)
npm run test:compare

# Original smoke test (staging only, no performance tracking)
npm run test:original
```

### Interactive Mode
```bash
# Open Cypress Test Runner
npm run cy:open

# Open with staging environment
npm run cy:open:staging

# Open with production environment
npm run cy:open:production
```

## Performance Metrics

The tests measure the following metrics for each page:
- **LCP (Largest Contentful Paint)**: How long the main content takes to load (target: <2500ms)
- **FCP (First Contentful Paint)**: When the first text/image appears (target: <1800ms)
- **TTFB (Time to First Byte)**: Server response speed (target: <800ms)
- **Total Load Time**: Complete page load duration
- **DOM Content Loaded**: Time until DOM is fully parsed
- **Load Complete**: Time until all resources are loaded
- **DNS Lookup Time**: DNS resolution duration
- **TCP Connection Time**: TCP handshake duration
- **Request/Response Time**: Server response times

## Performance Reports

After running tests, performance reports are generated in `cypress/results/`:
- `performance-staging.json` - Raw staging metrics
- `performance-production.json` - Raw production metrics
- `performance-comparison.json` - Comparison data
- `PERFORMANCE_REPORT.md` - Human-readable markdown report
- `SLACK_BLOCKS.json` - Slack Block Kit payload for notifications

Historical data is stored in `.performance-history/` and committed back to the repo after each run (6-month retention).

### Sample Report Format

```
Metric              Stg(now)  Stg(hist)  Prod(now)  Prod(hist)  Diff
────────────────────────────────────────────────────────────────────
LCP (<2500ms)       1840      1920       1650       1700        ✅
FCP (<1800ms)       950       1020       820        880         ✅
TTFB (<800ms)       320       290        210        240         ✅
Total Load Time     2132      1980       1776       1820        -356ms
DOM Content Loaded  2132      1950       1244       1300
Load Complete       2132      1980       1776       1820

Sample Size         3 x       18 x       3 x        18 x
```

## GitHub Actions Workflow

The CI/CD pipeline runs automatically on:
- Push to `main` branch
- Pull requests
- Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- Manual workflow dispatch

### Workflow Jobs

1. **staging-tests**: Runs tests against staging environment
2. **production-tests**: Runs tests against production environment
3. **performance-comparison**: Generates comparison report, posts to PR, and sends Slack notification

### Slack Notifications

The workflow sends performance test results to Slack with:
- Test status (success/failure)
- Repository and branch information
- Link to workflow run and artifacts
- Performance report availability

**Setup:**
1. Create a Slack Incoming Webhook:
   - Go to https://api.slack.com/apps
   - Create new app → "From scratch"
   - Enable "Incoming Webhooks"
   - Add webhook to your workspace
   - Copy the webhook URL
2. Add webhook URL to repository secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Create new secret: `SLACK_WEBHOOK_URL`
   - Paste your webhook URL
3. The workflow will automatically send notifications on every run

## Project Structure

```
.
├── cypress/
│   ├── e2e/
│   │   ├── istqb-org-smoke-tests.cy.js      # Original smoke test
│   │   ├── staging-smoke-tests.cy.js         # Staging with performance
│   │   ├── production-smoke-tests.cy.js      # Production with performance
│   │   └── performance-comparison.cy.js      # Comparison report generator
│   ├── support/
│   │   ├── commands.js                       # Custom Cypress commands
│   │   ├── e2e.js                           # Global config & PerformanceObserver setup
│   │   ├── pdfUtils.js                      # PDF validation utilities
│   │   └── performanceUtils.js              # Performance measurement utilities
│   └── results/                             # Generated performance reports (gitignored)
├── .performance-history/                    # Historical performance data (committed)
├── scripts/
│   └── cleanup-performance-history.js       # Prunes history older than 6 months
├── .github/
│   └── workflows/
│       └── cypress.yml                      # CI/CD pipeline
├── cypress.config.js                        # Cypress configuration
└── package.json                             # Project dependencies and scripts
```

## Configuration

### Cypress Config ([`cypress.config.js`](cypress.config.js))

```javascript
module.exports = {
  projectId: "ed878t",
  e2e: {
    baseUrl: 'https://istqb.org',
    chromeWebSecurity: false,  // Allow cross-origin navigation
    allowCypressEnv: false,    // Use cy.env() instead of Cypress.env()
    env: {
      stagingUrl: 'http://54.246.123.236/',
      productionUrl: 'https://istqb.org'
    }
  }
}
```

### Environment Variables

Set `testEnv` to switch between environments:
```bash
cypress run --env testEnv=staging
cypress run --env testEnv=production
```

## Error Handling

The tests automatically suppress known third-party errors:
- Cross-origin script errors
- ResponsiveVoice TTS API issues
- Google Analytics postMessage errors
- Network errors from external widgets

## Requirements

- Node.js 24+
- Cypress 15.13.0+

## Troubleshooting

### Cross-Origin Errors
If you encounter cross-origin errors, ensure `chromeWebSecurity: false` is set in [`cypress.config.js`](cypress.config.js).

### Performance Data Not Found
Run staging and production tests before running the comparison:
```bash
npm run test:staging
npm run test:production
npm run test:compare
```

### GitHub Actions Failures
Check that the `CYPRESS_RECORD_KEY` secret is properly configured in your repository settings.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests locally: `npm test`
4. Submit a pull request

The CI pipeline will automatically run tests and post performance comparison results to your PR.

## License

Private project - All rights reserved