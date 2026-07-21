// eslint.config.js — flat config (required by ESLint 9+)
//
// This replaces .eslintrc.json, which ESLint 9 no longer reads at all (it
// silently found no config and refused to run — see CLAUDE.md "Known Issues").
// This is a format migration, not a rules rewrite: scope and severities match
// the old config, with one deliberate change noted inline below.

const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const globals = require('globals');

module.exports = [
  {
    // Mirrors the old ignorePatterns, scoped to keep linting on this repo's
    // actual TS/TSX app source and out of build output, native folders, and
    // the many ad hoc .cjs/.js debug/verify scripts at the repo root that
    // were never part of the app build.
    ignores: [
      'dist/**',
      'node_modules/**',
      'android/**',
      '.expo/**',
      'coverage/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      '**/*.disabled',
      '**/*.bak',
      '**/*.backup',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Deliberate changes from the old config, both matching
      // typescript-eslint's own documented guidance for TS/TSX files:
      // - no-unused-vars: off in favor of the TS-aware version only —
      //   the base rule doesn't understand TS syntax.
      // - no-undef: off — TypeScript's own compiler (npm run type-check)
      //   already catches genuinely undefined symbols, and does it
      //   correctly for TS-only constructs (ambient lib types like
      //   HeadersInit/RequestInit, type-only imports, etc.) that the
      //   base JS no-undef rule flags as false positives.
      // Severity intent for the remaining rules is unchanged.
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // React Native's Metro bundler requires literal require() for static
      // image assets (import doesn't work) and this codebase also uses
      // require() inside try/catch to guard native modules unavailable in
      // Expo Go (services/oauthService.ts, utils/safeAppState.ts). Every
      // current occurrence in this repo is one of those two legitimate
      // cases, not an accidental CommonJS import — confirmed by hand before
      // disabling this rule.
      '@typescript-eslint/no-require-imports': 'off',
      // declare global { namespace Express { ... } } is the standard,
      // documented way to augment Express's own request/user types in
      // TypeScript — there is no ES2015-module equivalent for extending a
      // third-party global namespace. Both current occurrences
      // (server/auth.ts, server/middleware/jwt-auth.ts) are exactly this.
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    // Jest test files get Jest's own globals (describe/it/expect/jest/...).
    // Note: plain .js test files (e.g. jest.setup.js, e2e/*.test.js) are
    // covered by the top-level `**/*.js` ignore above, not linted here.
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
