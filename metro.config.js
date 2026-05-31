const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add 'cjs' to source extensions
defaultConfig.resolver.sourceExts.push('cjs');

// Disable unstable package exports to resolve the Firebase compatibility issue
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
