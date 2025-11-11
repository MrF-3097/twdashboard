'use strict';

const next = require('next');
const https = require('https');
const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const dev = true;
const hostname = '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

function getCertOptions() {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;

  if (keyPath && certPath) {
    try {
      return {
        key: fs.readFileSync(path.resolve(keyPath)),
        cert: fs.readFileSync(path.resolve(certPath)),
      };
    } catch (e) {
      console.warn('[HTTPS] Failed to read provided SSL files, falling back to self-signed:', e.message);
    }
  }

  // Generate self-signed cert if not provided
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
  });

  console.log('[HTTPS] Using self-signed certificate for development');
  return {
    key: pems.private,
    cert: pems.cert,
  };
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const options = getCertOptions();
  const server = https.createServer(options, (req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, () => {
    console.log(`\n   ▲ Next.js (HTTPS Dev)\n   - Local:        https://localhost:${port}\n   - Network:      https://${hostname}:${port}\n   - Note: Using self-signed certificate (privacy warning expected in browser)\n`);
  });
}).catch((err) => {
  console.error('Failed to start HTTPS dev server:', err);
  process.exit(1);
});


