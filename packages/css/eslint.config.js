module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'no-var': 'off',
      },
    },
  ],
};
