import rootConfig from '../../eslint.config.mjs';

export default {
  extends: [rootConfig],
  ignores: ['!**/*', "build", "jest.config.js"],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@nx/typescript', 'plugin:@nx/react'],
      rules: {
        '@typescript-eslint/no-empty-object-type': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'unused-imports/no-unused-vars': 'off',
        'no-fallthrough': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'no-case-declarations': 'off',
        'no-console': [
          'error',
          {
            allow: ['warn', 'debug'],
          },
        ],
        'no-unsafe-optional-chaining': 'off',
        'no-empty': 'off',
        'react/jsx-key': 'off',
        'react-hooks/exhaustive-deps': [
          'warn',
          {
            additionalHooks: '(!useAtom)',
          },
        ],
        'react/display-name': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-namespace': 'off',
      },
    },
  ],
};
