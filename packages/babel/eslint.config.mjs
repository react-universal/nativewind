import tsPlugin from '@nx/eslint-plugin/typescript.js';
import rootConfig from '../../eslint.config.mjs';

export default {
  extends: [rootConfig],
  ignores: ['!**/*', 'test/fixtures/**/*'],
  overrides: [
    {
      files: ['*.ts'],
      extends: [...tsPlugin.configs.typescript],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'require-yield': 'off',
        'no-useless-escape': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
