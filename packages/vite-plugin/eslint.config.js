module.exports = {
  extends: '../../eslint.config.js',
  ignorePatterns: ['!**/*', 'build', 'esbuild.mjs'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        'no-empty': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'require-yield': 'off',
        'no-control-regex': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
};