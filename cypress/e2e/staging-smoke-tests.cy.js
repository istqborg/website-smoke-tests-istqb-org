import { checkPdfDownloadable } from '../support/pdfUtils';
import { measurePageLoad, recordPerformance } from '../support/performanceUtils';

describe('Staging Environment - istqb.org health check', () => {
  const environment = 'staging';

  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Ensure performance API is available
        win.performance.mark('test-start');
      }
    });
  });

  it('staging health check with performance measurement', () => {
    // Measure landing page load
    measurePageLoad('Staging - Landing Page');
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
    measurePageLoad('Staging - Certifications Page');
    cy.window().then((win) => {
      const metrics = win.__performanceMetrics[win.__performanceMetrics.length - 1];
      recordPerformance(environment, { page: 'certifications', ...metrics });
    });

    cy.contains('Our Certifications');
    cy.contains('Certified Tester Foundation Level (CTFL) v4.0');

    // Open the CTFL details page
    cy.contains('a', 'Read more').first().then(($link) => {
      const href = $link.attr('href');
      if (href.includes('istqb.org')) {
        cy.env(['stagingUrl']).then(({ stagingUrl }) => {
          const url = href.replace('https://istqb.org', stagingUrl).replace(/\/$/, '');
          cy.visit(url);
        });
      } else {
        cy.visit(href);
      }
    });
    cy.url().should('include', '/certified-tester-foundation-level-ctfl-v4-0');

    // Measure CTFL details page load
    measurePageLoad('Staging - CTFL Details Page');
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
