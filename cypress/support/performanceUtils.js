/**
 * Measure page load performance metrics
 * @param {string} label - Label for the measurement
 * @returns {object} Performance metrics
 */
export function measurePageLoad(label = 'Page Load') {
  return cy.window().then((win) => {
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

    return metrics;
  });
}

/**
 * Store performance metrics for comparison
 */
const performanceData = {};

export function recordPerformance(environment, metrics) {
  if (!performanceData[environment]) {
    performanceData[environment] = [];
  }
  performanceData[environment].push(metrics);
  
  // Write to file for later analysis
  cy.writeFile(`cypress/results/performance-${environment}.json`, performanceData[environment]);
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

// Made with Bob
