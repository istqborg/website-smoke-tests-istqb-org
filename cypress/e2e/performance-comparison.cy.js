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
            const stagingNow = stagingData.filter(m => m.page === page);
            const productionNow = productionData.filter(m => m.page === page);
            const stagingHist = (stagingHistory || []).filter(m => m.page === page);
            const productionHist = (productionHistory || []).filter(m => m.page === page);

            if (stagingMetrics.length > 0 && productionMetrics.length > 0) {
              const stagingAvg = average(stagingMetrics.map(m => m.totalTime));
              const productionAvg = average(productionMetrics.map(m => m.totalTime));
              const difference = productionAvg - stagingAvg;
              const percentDiff = ((difference / stagingAvg) * 100).toFixed(2);

              const avgMetrics = (arr, key) => arr.length > 0 ? Math.round(average(arr.map(m => m[key]))) : null;

              comparison[page] = {
                staging: {
                  avgTotalTime: Math.round(stagingAvg),
                  avgDomContentLoaded: avgMetrics(stagingMetrics, 'domContentLoaded'),
                  avgLoadComplete: avgMetrics(stagingMetrics, 'loadComplete'),
                  sampleSize: stagingMetrics.length,
                  now: {
                    avgTotalTime: avgMetrics(stagingNow, 'totalTime'),
                    avgDomContentLoaded: avgMetrics(stagingNow, 'domContentLoaded'),
                    avgLoadComplete: avgMetrics(stagingNow, 'loadComplete'),
                    sampleSize: stagingNow.length
                  },
                  historical: {
                    avgTotalTime: avgMetrics(stagingHist, 'totalTime'),
                    avgDomContentLoaded: avgMetrics(stagingHist, 'domContentLoaded'),
                    avgLoadComplete: avgMetrics(stagingHist, 'loadComplete'),
                    sampleSize: stagingHist.length
                  }
                },
                production: {
                  avgTotalTime: Math.round(productionAvg),
                  avgDomContentLoaded: avgMetrics(productionMetrics, 'domContentLoaded'),
                  avgLoadComplete: avgMetrics(productionMetrics, 'loadComplete'),
                  sampleSize: productionMetrics.length,
                  now: {
                    avgTotalTime: avgMetrics(productionNow, 'totalTime'),
                    avgDomContentLoaded: avgMetrics(productionNow, 'domContentLoaded'),
                    avgLoadComplete: avgMetrics(productionNow, 'loadComplete'),
                    sampleSize: productionNow.length
                  },
                  historical: {
                    avgTotalTime: avgMetrics(productionHist, 'totalTime'),
                    avgDomContentLoaded: avgMetrics(productionHist, 'domContentLoaded'),
                    avgLoadComplete: avgMetrics(productionHist, 'loadComplete'),
                    sampleSize: productionHist.length
                  }
                },
                difference: {
                  totalTime: Math.round(difference),
                  percentage: percentDiff
                }
              };
            }
          });

          // Generate report
          cy.env(['stagingUrl', 'productionUrl']).then(({ stagingUrl, productionUrl }) => {
            const report = {
              timestamp: new Date().toISOString(),
              summary: {
                stagingUrl,
                productionUrl
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

            // Generate Slack payload with blocks
            const slackBlocks = generateSlackBlocks(report);
            const slackPayload = {
              text: `🚀 Performance Comparison Report - ISTQB`,
              blocks: slackBlocks
            };
            cy.writeFile('cypress/results/SLACK_BLOCKS.json', slackPayload);
          });
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

function generateSlackBlocks(report) {
  const blocks = [];

  // Header
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: '📊 Performance Comparison Report'
    }
  });

  // Report metadata
  blocks.push({
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Generated:*\n${new Date(report.timestamp).toLocaleString()}`
      },
      {
        type: 'mrkdwn',
        text: '*Status:* ✅ Complete'
      }
    ]
  });

  // URLs
  blocks.push({
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Staging URL:*\n${report.summary.stagingUrl}`
      },
      {
        type: 'mrkdwn',
        text: `*Production URL:*\n${report.summary.productionUrl}`
      }
    ]
  });

  blocks.push({
    type: 'divider'
  });

  // Generate section for each page
  Object.keys(report.comparison).forEach(page => {
    const data = report.comparison[page];
    const pageName = page.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isStagingFaster = data.difference.totalTime > 0;
    const icon = Math.abs(parseFloat(data.difference.percentage)) < 10 ? '✅' : (isStagingFaster ? '⚡' : '🐢');

    // Page header
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${icon} ${pageName}*`
      }
    });

    // Performance metrics table
    const fmt = (v) => v != null ? String(v) : 'n/a';
    const sn = data.staging.now;
    const sh = data.staging.historical;
    const pn = data.production.now;
    const ph = data.production.historical;

    let tableText = '```\n';
    tableText += 'Metric              Stg(now)  Stg(hist)  Prod(now)  Prod(hist)  Diff\n';
    tableText += '────────────────────────────────────────────────────────────────────\n';
    tableText += `Total Load Time     ${fmt(sn.avgTotalTime).padEnd(9)} ${fmt(sh.avgTotalTime).padEnd(10)} ${fmt(pn.avgTotalTime).padEnd(10)} ${fmt(ph.avgTotalTime).padEnd(11)} ${data.difference.totalTime}ms\n`;
    tableText += `DOM Content Loaded  ${fmt(sn.avgDomContentLoaded).padEnd(9)} ${fmt(sh.avgDomContentLoaded).padEnd(10)} ${fmt(pn.avgDomContentLoaded).padEnd(10)} ${fmt(ph.avgDomContentLoaded).padEnd(11)}\n`;
    tableText += `Load Complete       ${fmt(sn.avgLoadComplete).padEnd(9)} ${fmt(sh.avgLoadComplete).padEnd(10)} ${fmt(pn.avgLoadComplete).padEnd(10)} ${fmt(ph.avgLoadComplete).padEnd(11)}\n`;
    tableText += `\nSample Size         ${String(sn.sampleSize + ' x').padEnd(9)} ${String(sh.sampleSize + ' x').padEnd(10)} ${String(pn.sampleSize + ' x').padEnd(10)} ${String(ph.sampleSize + ' x').padEnd(11)}\n`;
    tableText += '```\n';

    // Performance verdict
    let verdict = '';
    if (Math.abs(parseFloat(data.difference.percentage)) < 10) {
      verdict = '✅ Performance is comparable (within 10% difference)';
    } else if (data.difference.totalTime < 0) {
      verdict = `🚀 Production is faster by ${Math.abs(data.difference.totalTime)}ms (${Math.abs(parseFloat(data.difference.percentage))}%)`;
    } else {
      verdict = `⚡ Staging is faster by ${data.difference.totalTime}ms (${data.difference.percentage}%)`;
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${tableText}${verdict}`
      }
    });

    // Divider between pages
    blocks.push({
      type: 'divider'
    });
  });

  // Footer with timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Generated: ${new Date(report.timestamp).toLocaleString()}`
      }
    ]
  });

  return blocks;
}