export default function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Temporarily disabled reanimated plugin due to dependency conflicts
    // plugins: [
    //   'react-native-reanimated/plugin' // Must be last
    // ],
  };
};
