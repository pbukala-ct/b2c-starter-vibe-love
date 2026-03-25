import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import a11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS + TypeScript
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React
  {
    plugins: { react: reactPlugin },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // not needed in Next.js
      'react/prop-types': 'off', // TypeScript handles this
    },
    settings: { react: { version: 'detect' } },
  },

  // React Hooks
  {
    plugins: { 'react-hooks': hooksPlugin },
    rules: hooksPlugin.configs.recommended.rules,
  },

  // Next.js
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Accessibility
  {
    plugins: { 'jsx-a11y': a11yPlugin },
    rules: a11yPlugin.configs.recommended.rules,
  },

  // Prettier (must come last to override formatting rules)
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Project-specific overrides
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },

  // Ignore generated/build output
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**'],
  }
);
