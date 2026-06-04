module.exports = {
  projectId: "ed878t",
  e2e: {
    baseUrl: 'https://istqb.org',
    chromeWebSecurity: false,
    pageLoadTimeout: 40000,
    env: {
      // Define multiple base URLs for testing
      stagingUrl: 'http://54.246.123.236/',
      productionUrl: 'https://istqb.org'
    },
    setupNodeEvents(on, config) {
      const fs = require('fs');
      const path = require('path');
      
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
        },
        log(message) {
          console.log(message);
          return null;
        },
        fileExists(filePath) {
          try {
            return fs.existsSync(filePath);
          } catch (e) {
            return false;
          }
        },
        readHistoricalData(environment) {
          try {
            const historyPath = path.join(process.cwd(), `.performance-history/performance-${environment}.json`);
            if (fs.existsSync(historyPath)) {
              const data = fs.readFileSync(historyPath, 'utf8');
              return JSON.parse(data);
            }
            return null;
          } catch (e) {
            return null;
          }
        }
      });

      // Allow setting baseUrl via environment variable
      if (config.env.testEnv === 'production') {
        config.baseUrl = config.env.productionUrl;
      } else if (config.env.testEnv === 'staging') {
        config.baseUrl = config.env.stagingUrl;
      }

      return config;
    }
  }
};
