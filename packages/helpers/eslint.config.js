module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'require-yield': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        'no-var': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
