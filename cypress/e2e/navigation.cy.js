describe('istqb.org navigation tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load homepage', () => {
    cy.contains('Improve & Certify your skills').should('be.visible');
  });

  it('should have clickable Certifications link', () => {
    cy.contains('a', 'Certifications').click();
    cy.url().should('include', '/certifications/');
  });

  it('should have clickable Accredited Training Providers link', () => {
    cy.contains('a', 'Accredited Training Providers').click();
    cy.url().should('include', '/training-providers/');
  });
});