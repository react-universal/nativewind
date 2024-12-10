module.exports = {
  extends: '../../eslint.config.js',
  ignores: ['!**/*', 'src/fixtures/*', 'remaps'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@nx/typescript', 'plugin:@nx/react'],
      rules: {
        'react-hooks/rules-of-hooks': ['warn'],
        'no-new-func': 'off',
        'no-template-curly-in-string': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-restricted-globals': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-inferrable-types': 'off',
        'require-yield': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'prefer-rest-params': 'off',
        'no-func-assign': 'off',
        'no-var': 'off',
        'prefer-spread': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
