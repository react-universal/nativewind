module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build', 'dist', 'webui'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@nx/typescript', 'plugin:@nx/react'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'require-yield': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
