const path = require('path');
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = function (env, argv) {
  return createExpoWebpackConfigAsync(env, argv).then((config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      '@shared': path.resolve(__dirname, '../shared'),
    };
    return config;
  });
};