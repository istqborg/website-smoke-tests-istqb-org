import { checkPdfDownloadable } from '../support/pdfUtils';
import { measurePageLoad, recordPerformance } from '../support/performanceUtils';

describe('Production Environment - istqb.org health check', () => {
  const environment = 'production';

  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Ensure performance API is available
        win.performance.mark('test-start');
      }
    });
  });

  it('production health check with performance measurement', () => {
    // Measure landing page load
    measurePageLoad('Production - Landing Page');
    cy.window().then((win) => {
      const metrics = win.__performanceMetrics[win.__performanceMetrics.length - 1];
      recordPerformance(environment, { page: 'landing', ...metrics });
    });

    // Open the landing page
    cy.scrollTo('bottom');
    cy.contains('Improve & Certify your skills');

    // Open certifications page
    cy.contains('a', 'Certifications', { matchCase: false }).click();
    cy.url().should('include', '/certifications/');
    
    // Measure certifications page load
    measurePageLoad('Production - Certifications Page');
    cy.window().then((win) => {
      const metrics = win.__performanceMetrics[win.__performanceMetrics.length - 1];
      recordPerformance(environment, { page: 'certifications', ...metrics });
    });

    cy.contains('Our Certifications');
    cy.contains('Certified Tester Foundation Level (CTFL) v4.0');

    // Open the CTFL details page
    cy.contains('h4 a', 'Read more').first().click();
    cy.url().should('include', '/certified-tester-foundation-level');

    // Measure CTFL details page load
    measurePageLoad('Production - CTFL Details Page');
    cy.window().then((win) => {
      const metrics = win.__performanceMetrics[win.__performanceMetrics.length - 1];
      recordPerformance(environment, { page: 'ctfl-details', ...metrics });
    });

    // Verify that syllabus PDF is downloadable and structurally valid
    cy.url().then((currentUrl) => {
      checkPdfDownloadable(currentUrl, {
        linkTextPattern: 'ISTQB.*Syllabus'
      });
    });
  });
});

// Made with Bob
