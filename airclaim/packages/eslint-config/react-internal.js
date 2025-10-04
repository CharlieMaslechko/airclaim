import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * ESLint configuration for internal React packages.
 * Flat config format (ESLint ≥8.21).
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,

  // React recommended config (includes parser + JSX support)
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],

  // Add globals like browser, serviceworker
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },

  // React plugin custom rules
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      react: pluginReact,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,

      // Remove unused legacy JSX rules
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Console allowed in dev context
      'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info'] }],
    },
  },
];
