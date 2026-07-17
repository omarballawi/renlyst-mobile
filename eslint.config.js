const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: [
      '.agents/**',
      'coverage/**',
      'dist/**',
      'ios/**',
      'android/**',
      'node_modules/**',
      'graphify-out/**',
    ],
  },
  expoConfig,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]);
