// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // 1. Ignore the "dist" folder (build outputs)
  globalIgnores(['dist']),

  // 2. Frontend app source – React/JSX files
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended, // React rules (flat config):contentReference[oaicite:12]{index=12}
      reactPlugin.configs.flat['jsx-runtime'], // React JSX runtime config (for React 17+)
      reactHooks.configs['recommended-latest'], // React Hooks rules (flat config):contentReference[oaicite:13]{index=13}
      reactRefresh.configs.vite, // React Refresh rules for Vite:contentReference[oaicite:14]{index=14}
      importPlugin.flatConfigs.recommended, // Import rules (flat config):contentReference[oaicite:15]{index=15}
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser, // enable window, document, etc.
      // parserOptions.ecmaFeatures.jsx is enabled by reactPlugin's flat config
    },
    settings: {
      react: { version: 'detect' }, // auto-detect React version
      // import/resolver settings for modules and alias
      'import/resolver': {
        node: { extensions: ['.js', '.jsx'] },
        alias: { map: [['@', './src']], extensions: ['.js', '.jsx'] },
      },
    },
    rules: {
      // project-specific rule customizations
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/prop-types': 'off',
      // (Add any other custom rules or overrides here as needed)
    },
  },

  // 3. Node/config files – no React/JSX, just NodeJS environment
  {
    files: [
      'vite.config.*',
      'eslint.config.*',
      'tailwind.config.*',
      'postcss.config.*',
      // add other config or script files as needed
    ],
    extends: [
      js.configs.recommended,
      importPlugin.flatConfigs.recommended, // Import rules for Node files
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node, // Node.js global variables (module, __dirname, etc.)
    },
    settings: {
      // Resolve imports for Node files (allow .cjs/.mjs if used)
      'import/resolver': {
        node: { extensions: ['.js', '.cjs', '.mjs'] },
      },
    },
    // You can add Node-specific rules here if any (optional)
  },
]);
