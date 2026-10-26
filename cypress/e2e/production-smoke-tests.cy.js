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
    cy.contains('Work With Us And Get Involved');

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
    cy.contains('a', 'Read more >').first().then(($link) => {
      const url = $link.attr('href');
      cy.visit(url);
    });
    cy.url().should('include', '/certified-tester-foundation-level-ctfl-v4-0');

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
});
