import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'flagwaver', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Downgrade to warnings for pragmatic development
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-empty': 'warn',
      // React hooks - some patterns in Three.js are intentional
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'warn', // Math.random in useMemo is intentional for particle systems
      'react-hooks/immutability': 'warn', // Texture modification in Three.js is standard pattern
      'react-hooks/set-state-in-effect': 'warn', // Some patterns need this for route changes
      // Allow non-component exports in test files and utility modules
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['customRender', 'render'] }],
    },
  },
  // Disable react-refresh for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
