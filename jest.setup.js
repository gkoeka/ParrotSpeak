// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  RN.NativeModules.SettingsManager = {
    settings: {
      AppleLocale: 'en_US',
      AppleLanguages: ['en'],
    },
  };
  
  // Mock Dimensions
  RN.Dimensions = {
    get: jest.fn(() => ({
      width: 375,
      height: 667,
    })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  // Mock Platform
  RN.Platform = {
    ...RN.Platform,
    OS: 'ios',
    Version: '14.0',
  };
  
  return RN;
});

// Mock useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}));

// Silence console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('Animated: `useNativeDriver`')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Set up global mocks
global.__DEV__ = true;