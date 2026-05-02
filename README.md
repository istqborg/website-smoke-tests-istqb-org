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

- **Staging**: `http://ec2-3-71-109-173.eu-central-1.compute.amazonaws.com`
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

### Sample Report Format

```markdown
# Performance Comparison Report

## Landing Page

| Metric | Staging | Production | Difference |
|--------|---------|------------|------------|
| Total Load Time | 1250ms | 1180ms | -70ms (-5.6%) |
| DOM Content Loaded | 890ms | 850ms | - |
| Load Complete | 1200ms | 1150ms | - |

✅ **Production is faster** by 70ms (5.6%)
```

## GitHub Actions Workflow

The CI/CD pipeline runs automatically on:
- Push to `main` branch
- Pull requests
- Daily at 8:00 AM UTC
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
│   │   ├── e2e.js                           # Global configuration
│   │   ├── pdfUtils.js                      # PDF validation utilities
│   │   └── performanceUtils.js              # Performance measurement utilities
│   └── results/                             # Generated performance reports (gitignored)
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
    baseUrl: 'http://ec2-3-71-109-173.eu-central-1.compute.amazonaws.com',
    chromeWebSecurity: false,  // Allow cross-origin navigation
    env: {
      stagingUrl: 'http://ec2-3-71-109-173.eu-central-1.compute.amazonaws.com',
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

- Node.js 20+
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