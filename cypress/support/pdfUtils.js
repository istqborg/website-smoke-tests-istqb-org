export function checkPdfContains(pageUrl, { linkTextPattern, hrefPattern, expectText }) {
  if (!pageUrl || !expectText) {
    throw new Error('Missing required parameters: pageUrl and expectText are mandatory');
  }

  cy.visit(pageUrl);

  let link;
  if (linkTextPattern) {
    const rx = new RegExp(linkTextPattern, 'i');
    link = cy.contains('a', rx).should('have.attr', 'href');
  } else if (hrefPattern) {
    link = cy.get(`a[href*="${hrefPattern}"]`).first().should('have.attr', 'href');
  } else {
    // fallback used by istqb.org
    link = cy.get('a[href*="sdm_process_download="]').first().should('have.attr', 'href');
  }

  link.then(pdfUrl => {
    const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${Cypress.config().baseUrl}${pdfUrl}`;

    cy.request({
      url: fullUrl,
      encoding: 'binary',
      followRedirect: true
    }).then(resp => {
      cy.task('parsePdfFromBuffer', resp.body).then(text => {
        expect(text).to.include(expectText);
      });
    });
  });
}