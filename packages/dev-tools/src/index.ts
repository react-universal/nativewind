import { noop } from '@native-twin/helpers';

export let useNativeTwinDevTools: typeof import('./useNativeTwinDevTools.js').useNativeTwinDevTools;

// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== 'production') {
  useNativeTwinDevTools = require('./useNativeTwinDevTools').useNativeTwinDevTools;
} else {
  useNativeTwinDevTools = () => {
    return { registerTree: noop, addListener: () => noop };
  };
}
