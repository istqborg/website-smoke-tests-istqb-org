// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Set up PerformanceObserver before each page load to capture LCP and FCP correctly.
// getEntriesByType() returns startTime:0 when called after load; observers must be
// registered before rendering starts to get accurate values.
Cypress.on('window:before:load', (win) => {
  win.__vitals = { lcp: null, fcp: null };

  try {
    const lcpObserver = new win.PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        win.__vitals.lcp = Math.round(entries[entries.length - 1].startTime);
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}

  try {
    const fcpObserver = new win.PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          win.__vitals.fcp = Math.round(entry.startTime);
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (_) {}
});

Cypress.on('uncaught:exception', (err) => {
  const msg = String(err?.message || '').toLowerCase();

  // Ignore cross-origin script noise and missing TTS API key
  if (msg.includes('script error')) return false;
  if (msg.includes('rvapikey') || msg.includes('responsivevoice')) return false;

  // Network errors from 3rd-party widgets
  if (msg.includes('err_empty_response') || msg.includes('name_not_resolved')) return false;

  // Google Analytics postMessage errors (cross-origin communication issues)
  if (msg.includes('postmessage')) return false;

  // otherwise, fail as usual
  return true;
});