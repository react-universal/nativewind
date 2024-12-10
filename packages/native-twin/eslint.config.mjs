import rootConfig from '../../eslint.config.mjs';

export default {
  extends: [rootConfig],
  ignores: ['!**/*', 'build'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unnecessary-type-constraint': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'prefer-rest-params': 'off',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      },
    },
  ],
};
