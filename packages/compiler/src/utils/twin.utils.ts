import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vm from 'node:vm';
import { type TailwindConfig, createTailwind, defineConfig } from '@native-twin/core';
import { createVirtualSheet } from '@native-twin/css';
import * as Option from 'effect/Option';
import type { InternalTwFn, InternalTwinConfig } from '../models/twin.types.js';
import { maybeLoadJS } from './modules.utils.js';
import { getTwinConfigPath } from './twin.utils.node.js';

export const extractTwinConfig = (
  configPath: string,
): TailwindConfig<InternalTwinConfig> => {
  let config = defineConfig({ content: [] });

  if (fs.existsSync(configPath)) {
    const userConfig = maybeLoadJS<TailwindConfig<InternalTwinConfig>>(configPath);

    if (Option.isSome(userConfig)) {
      return userConfig.value;
    }
  }

  // biome-ignore lint/style/noParameterAssign: <explanation>
  configPath = getTwinConfigPath(path.dirname(configPath)).pipe(Option.getOrThrow);

  config = maybeLoadJS<TailwindConfig<InternalTwinConfig>>(configPath).pipe(
    Option.getOrElse(() => config),
  );

  return config;
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
