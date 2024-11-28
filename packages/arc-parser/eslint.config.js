module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            destructuredArrayIgnorePattern: '_',
          },
        ],
      },
    },
  ],
};
