import rootConfig from '../../eslint.config.mjs';

module.exports = {
  extends: [rootConfig],
  ignores: ['!**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['plugin:@nx/typescript'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            destructuredArrayIgnorePattern: '_',
          },
        ],
      },
    },
  ],
};
