describe('Performance Comparison Report', () => {
  it('should generate performance comparison between staging and production', () => {
    // Read performance data from both environments
    cy.readFile('cypress/results/performance-staging.json', { log: false }).then((stagingData) => {
      cy.readFile('cypress/results/performance-production.json', { log: false }).then((productionData) => {
        
        // Calculate averages for each page
        const pages = ['landing', 'certifications', 'ctfl-details'];
        const comparison = {};

        pages.forEach(page => {
          const stagingMetrics = stagingData.filter(m => m.page === page);
          const productionMetrics = productionData.filter(m => m.page === page);

          if (stagingMetrics.length > 0 && productionMetrics.length > 0) {
            const stagingAvg = average(stagingMetrics.map(m => m.totalTime));
            const productionAvg = average(productionMetrics.map(m => m.totalTime));
            const difference = productionAvg - stagingAvg;
            const percentDiff = ((difference / stagingAvg) * 100).toFixed(2);

            comparison[page] = {
              staging: {
                avgTotalTime: Math.round(stagingAvg),
                avgDomContentLoaded: Math.round(average(stagingMetrics.map(m => m.domContentLoaded))),
                avgLoadComplete: Math.round(average(stagingMetrics.map(m => m.loadComplete)))
              },
              production: {
                avgTotalTime: Math.round(productionAvg),
                avgDomContentLoaded: Math.round(average(productionMetrics.map(m => m.domContentLoaded))),
                avgLoadComplete: Math.round(average(productionMetrics.map(m => m.loadComplete)))
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
          cy.log(`Staging: ${data.staging.avgTotalTime}ms`);
          cy.log(`Production: ${data.production.avgTotalTime}ms`);
          cy.log(`Difference: ${data.difference.totalTime}ms (${data.difference.percentage}%)`);
        });

        // Generate markdown report
        const markdown = generateMarkdownReport(report);
        cy.writeFile('cypress/results/PERFORMANCE_REPORT.md', markdown);
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
    md += `| Total Load Time | ${data.staging.avgTotalTime}ms | ${data.production.avgTotalTime}ms | ${data.difference.totalTime}ms (${data.difference.percentage}%) |\n`;
    md += `| DOM Content Loaded | ${data.staging.avgDomContentLoaded}ms | ${data.production.avgDomContentLoaded}ms | - |\n`;
    md += `| Load Complete | ${data.staging.avgLoadComplete}ms | ${data.production.avgLoadComplete}ms | - |\n\n`;

    // Add performance verdict
    if (Math.abs(parseFloat(data.difference.percentage)) < 10) {
      md += '✅ **Performance is comparable** (within 10% difference)\n\n';
    } else if (data.difference.totalTime < 0) {
      md += `✅ **Production is faster** by ${Math.abs(data.difference.totalTime)}ms (${Math.abs(parseFloat(data.difference.percentage))}%)\n\n`;
    } else {
      md += `⚠️ **Staging is faster** by ${data.difference.totalTime}ms (${data.difference.percentage}%)\n\n`;
    }
  });

  return md;
}

// Made with Bob
