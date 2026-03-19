import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.spec.js', '**/*.test.js'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      globals: {
        browser: true,
        MiniZinc: 'readonly',
        console: true,
        document: true,
        window: true,
        fetch: true,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    },
  },
  {
    ignores: [
      'node_modules/',
      '*.min.js',
      'playwright.config.js',
      'playwright-report',
    ],
  },
];
