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
      caughtErrorsIgnorePattern: '^_'
    }],
    'no-constant-condition': 'error',
    'no-unreachable': 'error',
    'no-fallthrough': 'error',
    'no-prototype-builtins': 'error',
    'no-extra-boolean-cast': 'error',
    'no-implicit-coercion': 'error',
    'yoda': ['error', 'never'],
    
    // TypeScript specific
    '@typescript-eslint/no-explicit-any': 'warn', // Warn for gradual adoption
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
  ],
}
