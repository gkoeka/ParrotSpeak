const detox = require('detox');
const config = require('../.detoxrc.js');

// Set up Detox before running tests
beforeAll(async () => {
  await detox.init(config);
  await device.launchApp();
});

// Clean up after all tests
afterAll(async () => {
  await detox.cleanup();
});