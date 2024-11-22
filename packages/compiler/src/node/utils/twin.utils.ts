import { createVirtualSheet } from '@native-twin/css';
import * as Option from 'effect/Option';
import fs from 'node:fs';
import vm from 'node:vm';
import { createTailwind, defineConfig, TailwindConfig } from '@native-twin/core';
import { InternalTwinConfig, InternalTwFn } from '../native-twin';
import { getTwinConfigPath } from '../native-twin/twin.utils.node';
import { maybeLoadJS } from './modules.utils';

export const extractTwinConfig = ({
  projectRoot,
  twinConfigPath,
}: {
  projectRoot: string;
  twinConfigPath: string;
}) => {
  let config = defineConfig({ content: [] });

  if (fs.existsSync(twinConfigPath)) {
    const userConfig = maybeLoadJS<TailwindConfig<InternalTwinConfig>>(twinConfigPath);

    if (Option.isSome(userConfig)) {
      return {
        config: userConfig.value,
        twinConfigPath,
      };
    }
  }

  twinConfigPath = getTwinConfigPath(projectRoot).pipe(Option.getOrThrow);

  config = maybeLoadJS<TailwindConfig<InternalTwinConfig>>(twinConfigPath).pipe(
    Option.getOrElse(() => config),
  );

  return {
    config,
    twinConfigPath,
  };
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
