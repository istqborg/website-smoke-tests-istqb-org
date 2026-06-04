describe('Performance Comparison Report', () => {
  it('should generate performance comparison between staging and production', () => {
    // Read current run data
    cy.readFile('cypress/results/performance-staging.json', { log: false }).then((stagingData) => {
      cy.readFile('cypress/results/performance-production.json', { log: false }).then((productionData) => {
        // Also read historical data if available
        cy.task('readHistoricalData', 'staging').then((stagingHistory) => {
          cy.task('readHistoricalData', 'production').then((productionHistory) => {
            // Combine current run and historical data
            const allStagingData = [...(stagingHistory || []), ...stagingData];
            const allProductionData = [...(productionHistory || []), ...productionData];

            // Calculate averages for each page using all available data
            const pages = ['landing', 'certifications', 'ctfl-details'];
            const comparison = {};

            pages.forEach(page => {
              const stagingMetrics = allStagingData.filter(m => m.page === page);
              const productionMetrics = allProductionData.filter(m => m.page === page);

              if (stagingMetrics.length > 0 && productionMetrics.length > 0) {
                const stagingAvg = average(stagingMetrics.map(m => m.totalTime));
                const productionAvg = average(productionMetrics.map(m => m.totalTime));
                const difference = productionAvg - stagingAvg;
                const percentDiff = ((difference / stagingAvg) * 100).toFixed(2);

                comparison[page] = {
                  staging: {
                    avgTotalTime: Math.round(stagingAvg),
                    avgDomContentLoaded: Math.round(average(stagingMetrics.map(m => m.domContentLoaded))),
                    avgLoadComplete: Math.round(average(stagingMetrics.map(m => m.loadComplete))),
                    sampleSize: stagingMetrics.length
                  },
                  production: {
                    avgTotalTime: Math.round(productionAvg),
                    avgDomContentLoaded: Math.round(average(productionMetrics.map(m => m.domContentLoaded))),
                    avgLoadComplete: Math.round(average(productionMetrics.map(m => m.loadComplete))),
                    sampleSize: productionMetrics.length
                  },
                  difference: {
                    totalTime: Math.round(difference),
                    percentage: percentDiff
                  }
                };
              }
            });

            // Generate report
            const report = {
              timestamp: new Date().toISOString(),
              summary: {
                stagingUrl: Cypress.env('stagingUrl'),
                productionUrl: Cypress.env('productionUrl')
              },
              comparison
            };

            // Write comparison report
            cy.writeFile('cypress/results/performance-comparison.json', report);

            // Log results to console
            cy.log('**Performance Comparison Report**');
            Object.keys(comparison).forEach(page => {
              const data = comparison[page];
              cy.log(`**${page.toUpperCase()}**`);
              cy.log(`Staging: ${data.staging.avgTotalTime}ms (${data.staging.sampleSize} samples)`);
              cy.log(`Production: ${data.production.avgTotalTime}ms (${data.production.sampleSize} samples)`);
              cy.log(`Difference: ${data.difference.totalTime}ms (${data.difference.percentage}%)`);
            });

            // Generate markdown report
            const markdown = generateMarkdownReport(report);
            cy.writeFile('cypress/results/PERFORMANCE_REPORT.md', markdown);
          });
        });
      });
    });
  });
});

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function generateMarkdownReport(report) {
  let md = '# Performance Comparison Report\n\n';
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `**Staging URL:** ${report.summary.stagingUrl}\n\n`;
  md += `**Production URL:** ${report.summary.productionUrl}\n\n`;
  md += '---\n\n';

  Object.keys(report.comparison).forEach(page => {
    const data = report.comparison[page];
    const pageName = page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    md += `## ${pageName}\n\n`;
    md += '| Metric | Staging | Production | Difference |\n';
    md += '|--------|---------|------------|------------|\n';
    md += `| Total Load Time | ${data.staging.avgTotalTime}ms (${data.staging.sampleSize}x) | ${data.production.avgTotalTime}ms (${data.production.sampleSize}x) | ${data.difference.totalTime}ms (${data.difference.percentage}%) |\n`;
    md += `| DOM Content Loaded | ${data.staging.avgDomContentLoaded}ms | ${data.production.avgDomContentLoaded}ms | - |\n`;
    md += `| Load Complete | ${data.staging.avgLoadComplete}ms | ${data.production.avgLoadComplete}ms | - |\n\n`;

    // Add performance verdict
    if (Math.abs(parseFloat(data.difference.percentage)) < 10) {
      md += '✅ **Performance is comparable** (within 10% difference)\n\n';
    } else if (data.difference.totalTime < 0) {
      md += `✅ **Production is faster** by ${Math.abs(data.difference.totalTime)}ms (${Math.abs(parseFloat(data.difference.percentage))}%)\n\n`;
    } else {
      md += `⚡ **Staging is faster** by ${data.difference.totalTime}ms (${data.difference.percentage}%)\n\n`;
    }
  });

  return md;
}

// Made with Bob
