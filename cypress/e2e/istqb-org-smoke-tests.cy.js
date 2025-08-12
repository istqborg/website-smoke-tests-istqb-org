import { checkPdfContains } from '../support/pdfUtils';

describe('istqb.org health check', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('istqb.org health check test', () => {
    // Open the landing page
    cy.scrollTo('bottom');
    cy.contains('Improve & Certify your skills');

    // Open certifications page
    cy.contains('a', 'Certifications', { matchCase: false }).click();
    cy.url().should('include', '/certifications/');
    cy.contains('Our Certifications');
    cy.contains('Certified Tester Foundation Level (CTFL) v4.0');

    // Open the CTFL details page
    cy.contains('h4 a', 'Read more').first().click();
    cy.url().should('include', '/certified-tester-foundation-level');

    // Verify that syllabus PDF is downloadable and contains the expected text
    cy.url().then((currentUrl) => {
      // Pass the current URL to the helper instead of a literal string
      checkPdfContains(currentUrl, {
        linkTextPattern: 'ISTQB.*Syllabus',
        expectText: 'International Software Testing Qualifications Board'
      });
    });
  });

  // it('Open SCR page', () => {
  //   // Open the landing page
  //   cy.contains('a', 'SCR', { matchCase: false }).click();
  //       // .invoke('removeAttr', 'target')
  //   cy.contains('Successful Candidate Register');
  // });
});