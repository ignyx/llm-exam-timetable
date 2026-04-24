import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginReact from '@eslint-react/eslint-plugin';

export default [
  js.configs.recommended,
  prettierConfig,
  eslintPluginReact.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.spec.js', '**/*.test.js'],
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
        React: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      '@eslint-react/no-prop-types': 'off',
      '@eslint-react/no-react-in-jsx-scope': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      '*.min.js',
      'playwright.config.js',
      'playwright-report',
      'dist/',
      'src/assets/',
    ],
  },
];
