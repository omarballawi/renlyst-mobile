const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web worker imports the wa-sqlite WebAssembly binary. Metro
// treats only configured extensions as assets, so keep this explicit while
// retaining Expo's default native configuration unchanged.
config.resolver.assetExts.push('wasm');

module.exports = config;
