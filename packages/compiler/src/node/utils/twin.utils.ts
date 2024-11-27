import { createVirtualSheet } from '@native-twin/css';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import glob from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createTailwind, defineConfig, TailwindConfig } from '@native-twin/core';
import type { InternalTwinConfig, InternalTwFn } from '../models/twin.types.js';
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

export const getFilesFromGlobs = (globs: string[]) =>
  pipe(
    RA.map(globs, (x) =>
      glob.sync(x, {
        absolute: true,
      }),
    ),
    RA.flatten,
    RA.map((file) => {
      const type = path.extname(file) === '' ? 'directory' : 'file';
      return {
        type,
        path: file,
      } as const;
    }),
    RA.flatMap((data) => {
      if (data.type === 'directory') return [data];
      const dir = {
        type: 'directory',
        path: path.dirname(data.path),
      } as const;
      return [data, dir];
    }),
    RA.dedupeWith((a, b) => a.path === b.path),
    RA.reduce(
      {
        directories: RA.empty<string>(),
        files: RA.empty<string>(),
      },
      (prev, current) => {
        switch (current.type) {
          case 'directory':
            return {
              ...prev,
              directories: [current.path, ...prev.directories],
            };
          case 'file':
            return {
              ...prev,
              files: [current.path, ...prev.files],
            };
        }
      },
    ),
    // RA.groupBy((x): 'directory' | 'file' => x.type),
    // Record.map((x) => x.map((_) => _.path)),
  );
