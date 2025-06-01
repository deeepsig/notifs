import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'
import pluginReact from 'eslint-plugin-react'
import prettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: parser // Ensure TypeScript support by passing the parser object
    },
    plugins: {
      prettier: pluginPrettier,
      '@typescript-eslint': tseslint,
      react: pluginReact,
      tailwindcss: tailwindcss
    },
    settings: {
      react: {
        version: 'detect' // Automatically detect the version of React to use
      }
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
      'plugin:tailwindcss/recommended'
    ],
    rules: {
      ...pluginJs.configs.recommended.rules, // JavaScript recommended rules
      ...tseslint.configs.recommended.rules, // TypeScript recommended rules
      ...pluginReact.configs.flat.recommended.rules, // React recommended rules
      ...prettier.rules, // Prettier config overrides

      // Custom rules
      'prettier/prettier': 'off', // Enforce Prettier rules
      'react/react-in-jsx-scope': 'off', // React 17+ doesn't require React in scope
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'react/jsx-no-target-blank': 'error', // Security rule for target="_blank"

      // Tailwind CSS specific rules
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/no-contradicting-classname': 'error'
    },
    env: {
      browser: true,
      es2020: true,
      jest: true,
      node: true
    }
  }
]
