import { getSheet } from '@native-twin/css';
import { defineConfig } from '../config/define-config.js';
import type { TailwindConfig, TailwindUserConfig } from '../types/config.types.js';
import type { RuntimeTW, __Theme__ } from '../types/theme.types.js';
import { isDevEnvironment } from './runtime.utils.js';
import { setup } from './tw.js';

/**
 * @group Runtime
 * @param config
 * @param isProduction
 */
export function install<Theme extends __Theme__ = __Theme__>(
  config: TailwindConfig<Theme>,
  isProduction?: boolean,
): RuntimeTW<Theme & __Theme__>;

export function install<Theme = __Theme__>(
  config: TailwindUserConfig<Theme>,
  isProduction?: boolean,
): RuntimeTW<__Theme__ & Theme>;

export function install(
  config: TailwindConfig | TailwindUserConfig,
  isProduction = !isDevEnvironment(),
): RuntimeTW {
  const config$ = defineConfig(config as TailwindUserConfig);

  return setup(
    {
      ...config$,
    } as any,
    () => getSheet(!isProduction),
  );
}
