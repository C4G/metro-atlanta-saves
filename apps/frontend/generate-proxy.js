const fs = require('fs');
const path = require('path');

// Get API_PORT from environment or use 3000 as default
const apiPort = process.env.API_PORT || '3000';

// Create a proxy configuration with the dynamic port
const proxyConfig = {
  '/api': {
    target: `http://localhost:${apiPort}`,
    secure: false,
    logLevel: 'debug',
  },
};

// Write the configuration to the proxy.conf.json file
fs.writeFileSync(path.join(__dirname, 'proxy.conf.json'), JSON.stringify(proxyConfig, null, 2));

console.log(`Generated proxy configuration pointing to API on port ${apiPort}`);
