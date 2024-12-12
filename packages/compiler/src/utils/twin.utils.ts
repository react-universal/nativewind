import * as vm from 'node:vm';
import { type TailwindConfig, createTailwind, defineConfig } from '@native-twin/core';
import { createVirtualSheet } from '@native-twin/css';
import * as Option from 'effect/Option';
import type { InternalTwFn, InternalTwinConfig } from '../models/Twin.models.js';
import { maybeLoadJS } from './modules.utils.js';

export const extractTwinConfig = (
  configPath: Option.Option<string>,
): TailwindConfig<InternalTwinConfig> => {
  return configPath.pipe(
    Option.flatMap(maybeLoadJS<TailwindConfig<InternalTwinConfig>>),
    Option.getOrElse(() => defineConfig({ content: [] })),
  );
};

export const createTwinProcessor = (
  platform: 'web' | 'native',
  twConfig: TailwindConfig<InternalTwinConfig>,
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
