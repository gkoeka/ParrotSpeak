import { getDefaultConfig } from 'expo/metro-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript and other file extensions
config.resolver.sourceExts.push('cjs');

// Enable symlinks for better development experience
config.resolver.unstable_enableSymlinks = true;

export default config;