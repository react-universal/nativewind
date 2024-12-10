import rootConfig from '../../eslint.config.mjs';

/** @type {import('eslint').ESLint.ConfigData} */
export default {
  extends: [rootConfig],
  ignores: ['!**/*', 'build', 'test/fixtures'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        'no-empty': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'require-yield': 'off',
        'prefer-rest-params': 'off',
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
