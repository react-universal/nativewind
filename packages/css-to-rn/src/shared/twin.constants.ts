export const TWIN_DEFAULT_FILES = [
  'tailwind.config.ts',
  'tailwind.config.js',
  'twin.config.ts',
  'twin.config.js',
  'native-twin.config.ts',
  'native-twin.config.js',
];

export const TWIN_CSS_FILES = [
  'twin.out.css',
  'twin.out.web.css',
  'twin.out.ios.css.js',
  'twin.out.android.css.js',
  'twin.out.native.css.js',
];

export const DEFAULT_TWIN_INPUT_CSS_FILE = 'twin.in.css';

export const BABEL_JSX_PLUGIN_IMPORT_RUNTIME = ['createTwinElement', '@native-twin/jsx'] as const;
