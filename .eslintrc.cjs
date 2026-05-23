// Phase 104d - ESLint config
// Standard React preset + react-hooks rules.
// rules-of-hooks is the rule that catches the Phase 104b/104c bug at lint time.
// exhaustive-deps catches stale-closure bugs in useEffect/useMemo/useCallback.
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    // The crash-prevention rules - these MUST stay on
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Quality-of-life relaxations for OpenI codebase conventions
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    'react-refresh/only-export-components': 'off',
  },
  overrides: [
    {
      // Test/script files can be looser
      files: ['**/*.test.{js,jsx}', '**/scripts/**'],
      rules: { 'no-unused-vars': 'off' },
    },
  ],
};
