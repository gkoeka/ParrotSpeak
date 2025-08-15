// plugins/withIapPlayFlavor.js
const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Ensures Gradle picks the Google Play flavor for react-native-iap:
 *   missingDimensionStrategy 'store', 'play'
 */
module.exports = function withIapPlayFlavor(config) {
  return withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;

    // Only add if not present already
    if (!src.includes("missingDimensionStrategy 'store', 'play'")) {
      // Find the defaultConfig block and append our line before its closing brace
      src = src.replace(
        /defaultConfig\s*{([\s\S]*?)\n\s*}/m,
        (match, inner) => `defaultConfig {${inner}\n        missingDimensionStrategy 'store', 'play'\n    }`
      );
      cfg.modResults.contents = src;
    }
    return cfg;
  });
};
