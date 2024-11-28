module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@nx/typescript', 'plugin:@nx/react'],
      rules: {
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unnecessary-type-constraint': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        eqeqeq: 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
