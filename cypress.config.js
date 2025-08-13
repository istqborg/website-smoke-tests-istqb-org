const pdfParse = require('pdf-parse');

module.exports = {
  projectId: "i6tyqa",
  e2e: {
    baseUrl: 'https://istqb.org',
    setupNodeEvents(on, config) {
      on('task', {
        parsePdfFromBuffer(pdfBuffer) {
          return pdfParse(Buffer.from(pdfBuffer, 'binary')).then(result => result.text);
        }
      });
    }
  }
};