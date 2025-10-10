// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

// plugins
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

// flat config helpers
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // ignore build output
  globalIgnores(['dist']),

  // === App source (browser) ===
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      // ⬇️ THIS is the crucial bit for JSX parsing
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    // Declare plugins ONCE here (no extends that also declare them)
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,
    },

    // Start from eslint:recommended only (no plugin presets here)
    extends: [js.configs.recommended],

    // Apply recommended rule sets manually to avoid plugin redefinition
    rules: {
      ...(reactPlugin.configs.flat.recommended?.rules ?? {}),
      ...(reactPlugin.configs.flat['jsx-runtime']?.rules ?? {}),
      ...(reactHooks.configs['recommended-latest']?.rules ?? {}),
      ...(importPlugin.flatConfigs.recommended?.rules ?? {}),

      // your tweaks
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/prop-types': 'off',
      'import/no-unresolved': 'error',
    },

    // Make ESLint resolve "@/..." -> "./src"
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx'],
        },
        node: { extensions: ['.js', '.jsx'] },
      },
    },
  },

  // === Node / config files ===
  {
    files: [
      'vite.config.*',
      'eslint.config.*',
      'tailwind.config.*',
      'postcss.config.*',
      '*.config.*',
      '*.cjs',
      '*.mjs',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },

    // Only eslint:recommended here, then import rules manually
    extends: [js.configs.recommended],

    plugins: { import: importPlugin },

    rules: {
      ...(importPlugin.flatConfigs.recommended?.rules ?? {}),
      // suppress false positive for vite plugin
      'import/no-unresolved': ['error', { ignore: ['^@tailwindcss/vite$'] }],
    },

    settings: {
      'import/resolver': { node: { extensions: ['.js', '.cjs', '.mjs'] } },
    },
  },
]);
