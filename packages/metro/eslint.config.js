module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'test/fixtures/*', 'build', 'bck'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        'no-control-regex': 'off',
        'no-var': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-empty': 'off',
        'require-yield': 'off',
      },
    },
  ],
};
