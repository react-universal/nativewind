module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', '.expo', 'metro-test'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'require-yield': 'off',
        'no-useless-escape': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
    {
      files: ['*.tsx'],
      extends: ['plugin:@nx/react'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
