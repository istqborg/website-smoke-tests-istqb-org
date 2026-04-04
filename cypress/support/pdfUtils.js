export function checkPdfDownloadable(pageUrl, { linkTextPattern, hrefPattern } = {}) {
  if (!pageUrl) {
    throw new Error('Missing required parameter: pageUrl');
  }

  cy.visit(pageUrl);

  let link;
  if (linkTextPattern) {
    const rx = new RegExp(linkTextPattern, 'i');
    link = cy.contains('a', rx).should('have.attr', 'href');
  } else if (hrefPattern) {
    link = cy.get(`a[href*="${hrefPattern}"]`).first().should('have.attr', 'href');
  } else {
    link = cy.get('a[href*="sdm_process_download="]').first().should('have.attr', 'href');
  }

  link.then(pdfUrl => {
    const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${Cypress.config().baseUrl}${pdfUrl}`;

    cy.request({
      url: fullUrl,
      encoding: 'binary',
      followRedirect: true
    }).then(resp => {
      expect(resp.status).to.equal(200);
      expect(resp.headers['content-type']).to.include('application/pdf');
      cy.task('validatePdfBuffer', resp.body).then(result => {
        expect(result.valid).to.be.true;
        expect(result.sizeBytes).to.be.greaterThan(10240);
      });
    });
  });
}
