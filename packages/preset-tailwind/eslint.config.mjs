import rootConfig from '../../eslint.config.mjs';

export default {
  extends: [rootConfig],
  ignores: ['!**/*', 'build'],
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
