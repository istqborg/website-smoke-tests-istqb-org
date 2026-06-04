/**
 * Measure page load performance metrics
 * @param {string} label - Label for the measurement
 * @returns {Cypress.Chainable} Chainable that resolves to performance metrics
 */
export function measurePageLoad(label = 'Page Load') {
  cy.window().then((win) => {
    const perfData = win.performance.timing;
    const navigationStart = perfData.navigationStart;
    
    const metrics = {
      label,
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,
      tcp: perfData.connectEnd - perfData.connectStart,
      request: perfData.responseStart - perfData.requestStart,
      response: perfData.responseEnd - perfData.responseStart,
      dom: perfData.domComplete - perfData.domLoading,
      loadComplete: perfData.loadEventEnd - navigationStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - navigationStart,
      totalTime: perfData.loadEventEnd - perfData.navigationStart
    };

    // Log metrics to console
    cy.log(`**${label} Performance**`);
    cy.log(`Total Time: ${metrics.totalTime}ms`);
    cy.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    cy.log(`Load Complete: ${metrics.loadComplete}ms`);

    // Store in window for later retrieval
    win.__performanceMetrics = win.__performanceMetrics || [];
    win.__performanceMetrics.push(metrics);
  });
}

/**
 * Store performance metrics for comparison
 * @param {string} environment - Environment name (staging/production)
 * @param {object} metrics - Performance metrics object
 */
export function recordPerformance(environment, metrics) {
  // Get run number from CI_RUN_ID env variable (e.g., "26951887595-staging-1" -> 1)
  const runId = process.env.CI_RUN_ID || 'local';
  const runNumber = runId.split('-').pop();
  const filePath = `cypress/results/performance-${environment}-run${runNumber}.json`;
  const historyPath = `.performance-history/performance-${environment}.json`;

  cy.task('log', `Recording performance for ${environment}`);
  cy.task('fileExists', filePath).then((exists) => {
    if (exists) {
      // File exists, read and append
      cy.readFile(filePath, { log: false }).then((existingData) => {
        const updatedData = Array.isArray(existingData) ? [...existingData, metrics] : [metrics];
        cy.writeFile(filePath, updatedData);
      });
    } else {
      // File doesn't exist, create new
      cy.writeFile(filePath, [metrics]);
    }
  });

  // Also append to historical data
  cy.task('fileExists', historyPath).then((historyExists) => {
    if (historyExists) {
      cy.readFile(historyPath, { log: false }).then((historyData) => {
        const enhancedMetrics = {
          ...metrics,
          timestamp: new Date().toISOString(),
          runId: process.env.CI_RUN_ID || 'local'
        };
        const updatedHistory = Array.isArray(historyData) ? [...historyData, enhancedMetrics] : [enhancedMetrics];
        cy.writeFile(historyPath, updatedHistory);
      });
    } else {
      const enhancedMetrics = {
        ...metrics,
        timestamp: new Date().toISOString(),
        runId: process.env.CI_RUN_ID || 'local'
      };
      cy.writeFile(historyPath, [enhancedMetrics]);
    }
  });
}

/**
 * Compare performance between two environments
 */
export function comparePerformance(env1Data, env2Data) {
  const comparison = {
    env1: {
      avgTotalTime: average(env1Data.map(m => m.totalTime)),
      avgDomContentLoaded: average(env1Data.map(m => m.domContentLoaded)),
      avgLoadComplete: average(env1Data.map(m => m.loadComplete))
    },
    env2: {
      avgTotalTime: average(env2Data.map(m => m.totalTime)),
      avgDomContentLoaded: average(env2Data.map(m => m.domContentLoaded)),
      avgLoadComplete: average(env2Data.map(m => m.loadComplete))
    }
  };

  comparison.difference = {
    totalTime: comparison.env2.avgTotalTime - comparison.env1.avgTotalTime,
    domContentLoaded: comparison.env2.avgDomContentLoaded - comparison.env1.avgDomContentLoaded,
    loadComplete: comparison.env2.avgLoadComplete - comparison.env1.avgLoadComplete
  };

  comparison.percentageDiff = {
    totalTime: ((comparison.difference.totalTime / comparison.env1.avgTotalTime) * 100).toFixed(2),
    domContentLoaded: ((comparison.difference.domContentLoaded / comparison.env1.avgDomContentLoaded) * 100).toFixed(2),
    loadComplete: ((comparison.difference.loadComplete / comparison.env1.avgLoadComplete) * 100).toFixed(2)
  };

  return comparison;
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

