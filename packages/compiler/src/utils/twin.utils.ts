import * as vm from 'node:vm';
import { createTailwind, defineConfig } from '@native-twin/core';
import { createVirtualSheet } from '@native-twin/css';
import * as Option from 'effect/Option';
import type { ImportedTwinConfig, InternalTwFn } from '../models/Twin.models.js';
import { maybeLoadJS } from './modules.utils.js';

// TODO: Remove once implements state
export const extractTwinConfig = (
  configPath: Option.Option<string>,
): ImportedTwinConfig => {
  return configPath.pipe(
    Option.flatMap(maybeLoadJS<ImportedTwinConfig>),
    Option.getOrElse(() => defineConfig({ content: [] })),
  );
};

export const createTwinProcessor = (
  platform: 'web' | 'native',
  twConfig: ImportedTwinConfig,
): InternalTwFn => {
  const context = vm.createContext({
    twConfig: defineConfig({
      ...twConfig,
      mode: platform,
    }),
    console: console,
    sheet: createVirtualSheet(),
    createTailwind: createTailwind,
    platform,
  });
  return vm.runInContext(
    `
    (() => {
      const tw = createTailwind(twConfig, sheet);
      return tw;
    })();
    `,
    context,
  );
};
