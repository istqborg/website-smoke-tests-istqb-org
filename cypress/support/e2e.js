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

Cypress.on('uncaught:exception', (err) => {
  const msg = String(err?.message || '').toLowerCase();

  // Ignore cross-origin script noise and missing TTS API key
  if (msg.includes('script error')) return false;
  if (msg.includes('rvapikey') || msg.includes('responsivevoice')) return false;

  // Network errors from 3rd-party widgets
  if (msg.includes('err_empty_response') || msg.includes('name_not_resolved')) return false;

  // otherwise, fail as usual
  return true;
});