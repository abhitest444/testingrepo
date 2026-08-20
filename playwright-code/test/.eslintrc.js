const { getPresetPath } = require('@appfabric/eslint-config-appfabric/next');

module.exports = {
  extends: '@appfabric/eslint-config-appfabric/jest',
  ignorePatterns: ['__mocks__/__generated__/'],
  rules: {
    // Your overridden rules
  },
  overrides: [
    {
      parser: require.resolve('@typescript-eslint/parser'),
      plugins: ['@typescript-eslint'],
      settings: {
        'import/resolver': {
          node: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
          },
          typescript: {
            project: ['../tsconfig.json'],
          },
        },
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        project: ['../tsconfig.json'],
      },
      files: ['**/*.ts?(x)'],
      extends: [getPresetPath('typescript')],
    },
  ],
};
