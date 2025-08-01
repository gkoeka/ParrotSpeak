export default function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Disable New Architecture features
      ['@babel/plugin-transform-flow-strip-types', { allowDeclareFields: true }]
    ],
    env: {
      development: {
        plugins: [
          // Disable TurboModules in development
        ]
      }
    }
  };
};
