module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Code quality rules  
    'no-undef': 'off', // Disabled for React JSX transform
    'no-unused-vars': 'off', // Use TS version instead
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrors: 'none'
    }],
    'no-constant-condition': 'error',
    'no-unreachable': 'error',
    'no-fallthrough': 'error',
    'no-prototype-builtins': 'error',
    'no-extra-boolean-cast': 'error',
    'no-implicit-coercion': 'error',
    'yoda': ['error', 'never'],
    
    // PREVENTATIVE: Block direct import.meta.env access outside env.ts
    // Use getMetaEnv() or isDevMode() from @/config/env instead.
    // See: docs/LEARNING_LOG.md - "E2E import.meta.env crash" (2026-02-28)
    'no-restricted-syntax': [
      'error',
      {
        selector: 'MemberExpression[object.object.type="MetaProperty"][object.property.name="env"][property.name=/^VITE_/]',
        message: 'Direct import.meta.env.VITE_* access is forbidden. Use getMetaEnv() from @/config/env instead to prevent E2E test crashes.'
      }
    ],
    
    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'error', // Enforce strict type safety
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-inferrable-types': 'error',
    
    // React specific
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: true,
        allowExportNames: ['useFormField'], // Allow hook exports in UI components
      },
    ],
  },
  overrides: [
    {
      files: ['src/components/ui/**/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off', // UI component libraries commonly export hooks with components
      },
    },
    {
      // Allow direct import.meta.env access ONLY in the env.ts module (the single source of truth)
      files: ['src/config/env.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
    {
      files: ['tests/**/*.ts', 'tests/**/*.tsx', 'src/**/__tests__/**/*.ts', 'src/**/__tests__/**/*.tsx', 'src/__tests__/**/*.ts'],
      rules: {
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unused-vars': 'off',
         'react-refresh/only-export-components': 'off',
         'no-restricted-syntax': 'off', // Tests may need to verify env behavior
      }
    }
  ],
}
