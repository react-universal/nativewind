module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        'no-useless-escape': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
