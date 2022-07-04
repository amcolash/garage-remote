const proxy = require('express-http-proxy');
const express = require('express');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

require('dotenv').config();

const PORT = process.env.PORT || 8003;
const validIPs = JSON.parse(process.env.VALID_IPS);

const app = express();

// HTTPS setup
const credentials = {};
if (existsSync('./.cert/privkey.pem')) credentials.key = readFileSync('./.cert/privkey.pem');

// Try to fix let's encrypt stuff based on this post
// https://community.letsencrypt.org/t/facebook-dev-error-curl-error-60-ssl-cacert/72782
if (existsSync('./.cert/fullchain.pem')) {
  credentials.cert = readFileSync('./.cert/fullchain.pem');
} else if (existsSync('./.cert/cert.pem')) {
  credentials.cert = readFileSync('./.cert/cert.pem');
}

// If the nas cert exists, use that instead of default cert
if (existsSync('./.cert/default/fullchain.pem')) {
  credentials.key = readFileSync('./.cert/default/privkey.pem');
  credentials.cert = readFileSync('./.cert/default/fullchain.pem');
}

// Make the server
if (credentials.cert && credentials.key) {
  const server = require('https').createServer(credentials, app);
  server.listen(PORT, '0.0.0.0');
  console.log(`Server running on port ${PORT} (HTTPS)`);
} else {
  console.error("Couldn't find TLS certs, this server expects to run on HTTPS");
  process.exit(1);
}

app.set('trust proxy', true);

app.use(express.static(join(__dirname, 'dist')));
app.use('/esp', [
  (req, res, next) => {
    const ip = req.socket.remoteAddress;

    // Filter out ip addresses before passing on to ESP
    if (validIPs.indexOf(ip) === -1) {
      res.send(401);
      return;
    }

    next();
  },
  proxy(process.env.SERVER),
]);
