module.exports = {
  projectId: "ed878t",
  e2e: {
    baseUrl: 'https://istqb.org',
    setupNodeEvents(on, config) {
      on('task', {
        validatePdfBuffer(pdfBuffer) {
          const buf = Buffer.from(pdfBuffer, 'binary');
          const magic = buf.slice(0, 4).toString('ascii');
          if (magic !== '%PDF') {
            throw new Error(`Not a PDF: magic bytes are "${magic}"`);
          }
          if (buf.length < 10240) {
            throw new Error(`PDF suspiciously small: ${buf.length} bytes`);
          }
          return { valid: true, sizeBytes: buf.length };
        }
      });
    }
  }
};
