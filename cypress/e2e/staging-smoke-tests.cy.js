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
    cy.contains('Work With Us And Get Involved');

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
    cy.contains('a', 'Read more >').first().then(($link) => {
      const href = $link.attr('href');
      if (href.includes('istqb.org')) {
        const stagingUrl = Cypress.env('stagingUrl');
          const url = href.replace('https://istqb.org', stagingUrl).replace(/\/$/, '');
          cy.visit(url);
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

  it('member boards page lists Polish Quality Board', () => {
    // Open the member boards page
    cy.visit('/member-boards/');
    cy.url().should('include', '/member-boards/');

    // Board cards are rendered client-side, wait until the list is populated
    cy.get('h3').should('have.length.greaterThan', 10);

    // Scroll down through the list to the Polish board
    cy.contains('h3', 'Polish Quality Board')
      .scrollIntoView()
      .should('be.visible');
  });

  it('training providers search finds AmberTeam Testing with its e-mail', () => {
    // Open the training providers page and wait for the (large) providers list to load
    cy.intercept('GET', '**/wp-json/istqb/v1/training-providers*').as('providers');
    cy.visit('/training-providers/');
    cy.url().should('include', '/training-providers/');
    cy.wait('@providers', { responseTimeout: 30000 });

    // Pick the provider from the autocomplete (the form is duplicated, use the visible one)
    cy.get('input[placeholder="Training providers..."]').filter(':visible').type('AmberTeam');
    cy.contains('div.cursor-pointer', /^AmberTeam Testing Sp\.z\.o\.o\.$/).click();
    cy.contains('button:visible', 'Search').click();

    // Verify the provider row shows the expected contact e-mail
    cy.contains('tr', 'AmberTeam Testing Sp.z.o.o.')
      .scrollIntoView()
      .should('be.visible')
      .and('contain', 'akademia@amberteam.pl');
  });

  it('exam providers search shows Polish Quality Board website in more information', () => {
    // Open the exam providers page and wait for the providers list to load
    cy.intercept('GET', '**/wp-json/istqb/v1/exam-providers*').as('examProviders');
    cy.visit('/exam-providers/');
    cy.url().should('include', '/exam-providers/');
    cy.wait('@examProviders', { responseTimeout: 30000 });

    // Pick the provider from the autocomplete and search
    cy.get('input[placeholder="Search for exam provider..."]').filter(':visible').type('Polish');
    cy.contains('div.cursor-pointer', /^Polish Quality Board$/).click();
    cy.contains('button:visible', 'Search').click();

    // Open the provider details
    cy.contains('tr', 'Polish Quality Board')
      .find('button[title="More Information"]')
      .click();

    // Verify the details show the provider website
    cy.contains('p', /Web Site:\s*https:\/\/pqb\.org\.pl/)
      .should('be.visible')
      .find('a')
      .should('have.attr', 'href', 'https://pqb.org.pl');
  });

  it('personas section opens Anya persona page', () => {
    // The landing page is already open (beforeEach), scroll down to the personas section
    cy.contains('h3', 'ISTQB® Personas').scrollIntoView().should('be.visible');

    // Find Anya's card and open it (the name is plain text, the card image is the link)
    cy.contains('h4', 'Anya')
      .closest('.box')
      .should('contain', 'Test Manager')
      .scrollIntoView()
      .find('a[href*="/persona-anya/"]')
      .click();
    cy.url().should('include', '/persona-anya/');

    // Verify the new persona image is loaded
    cy.get('img[alt="Anya_083126_Fullnames"]')
      .filter(':visible')
      .first()
      .should(($img) => expect($img[0].naturalWidth).to.be.greaterThan(0));

    // Verify the description and the label buttons below it (they have no link, just labels)
    cy.contains('p', 'First as a manual tester, then automating tests and now managing test projects for a company')
      .should('be.visible')
      .then(($desc) => {
        const descBottom = $desc.offset().top + $desc.outerHeight();
        cy.contains('a.button', 'Empowering Team Members')
          .should('be.visible')
          .and(($btn) => {
            expect($btn).not.to.have.attr('href');
            expect($btn.offset().top).to.be.greaterThan(descBottom);
          });
      });
  });

  it('find a partner page loads more than 200 partner tiles', () => {
    // Open the find a partner page
    cy.visit('/partner-program/find-a-partner/');
    cy.url().should('include', '/partner-program/find-a-partner/');

    // Partner tiles are rendered client-side, wait until the list is populated
    // (.sds-card is the current production markup, .partner-card the new one on staging)
    cy.get('.sds-card, .partner-card', { timeout: 30000 })
      .should('have.length.greaterThan', 200)
      .first()
      .should('be.visible');
  });

  it('academia papers page offers Boundary Value Analysis white paper download', () => {
    const pdfFile = 'Boundary-Value-Analysis-white-paper.pdf';

    // Open the academia papers and publications page
    cy.visit('/academia-papers-and-publications/');
    cy.url().should('include', '/academia-papers-and-publications/');

    // Find the white paper title (the layout is duplicated, use the visible one) and its download button
    cy.contains('strong', 'Boundary Value Analysis According to the ISTQB® Foundation Level Syllabus')
      .filter(':visible')
      .first()
      .scrollIntoView()
      .closest('.col-inner')
      .contains('a', 'Download')
      .should('be.visible')
      .and('have.attr', 'href')
      .and('include', pdfFile);

    // Verify that the white paper PDF is downloadable and structurally valid
    cy.url().then((currentUrl) => {
      checkPdfDownloadable(currentUrl, { hrefPattern: pdfFile });
    });
  });

  it('recognition program lists more than 1 institution and more than 5 individuals', () => {
    // Open the recognition program page
    cy.visit('/recognition-program/');
    cy.url().should('include', '/recognition-program/');

    // Verify the institutions board has more than 1 recognized institution
    cy.get('#board-institutions')
      .scrollIntoView()
      .should('be.visible')
      .and('contain', 'Institutions')
      .find('.partner-card')
      .should('have.length.greaterThan', 1);

    // Verify the individuals board (grouped by member board) has more than 5 recognized individuals
    cy.get('#board-individuals')
      .scrollIntoView()
      .should('be.visible')
      .and('contain', 'Individuals')
      .find('.partner-card')
      .should('have.length.greaterThan', 5);
  });
});
