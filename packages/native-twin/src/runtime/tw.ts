import { getSheet, type Sheet } from '@native-twin/css';
import { noop } from '@native-twin/helpers';
import { createTailwind } from '../native-twin.js';
import type { Preset, TailwindConfig, TailwindUserConfig } from '../types/config.types.js';
import type { ExtractThemes, RuntimeTW, __Theme__ } from '../types/theme.types.js';
import { mutationObserver } from './mutation-observer.js';
import { isDevEnvironment } from './runtime.utils.js';

let active: RuntimeTW = noop as any as RuntimeTW;
// const subscriptions = new Set<(cb: TailwindConfig<any>) => void>();

function assertActive() {
  if (isDevEnvironment() && !tw) {
    throw new Error(
      `No active instance found. Make sure to call setup or install before accessing tw.`,
    );
  }
}

export const tw: RuntimeTW<__Theme__> = /* #__PURE__ */ new Proxy(
  // just exposing the active as tw should work with most bundlers
  // as ES module export can be re-assigned BUT some bundlers to not honor this
  // -> using a delegation proxy here
  noop as unknown as RuntimeTW<any>,
  {
    apply(_target, _thisArg, args = ['']) {
      if (isDevEnvironment()) assertActive();
      return active.apply(_thisArg, [['', ...args].join('')]);
    },

    get(target, property) {
      if (isDevEnvironment()) {
        // Workaround webpack accessing the prototype in dev mode
        if (!active && property in target) {
          return (target as any)[property];
        }

        assertActive();
      }

      // if (property === 'observeConfig') {
      //   // @ts-expect-error
      //   subscriptions.add.apply(subscriptions, arguments);
      //   return function () {
      //     return () => {
      //       // @ts-expect-error
      //       subscriptions.delete.apply(subscriptions, arguments);
      //     };
      //   };
      // }

      // const value = active[property as keyof RuntimeTW];
      if (property === 'theme') {
        const value = active[property];
        return function () {
          if (isDevEnvironment()) assertActive();
          return value.apply(active, arguments as unknown as [string, string]);
        };
      }
      if (property === 'observeConfig') {
        const value = active[property];
        return function () {
          if (isDevEnvironment()) assertActive();
          return value.apply(active, arguments as unknown as any);
        };
      }
      const value = active[property as Exclude<keyof RuntimeTW, 'theme'>];
      if (typeof value == 'function') {
        return function () {
          if (isDevEnvironment()) assertActive();
          return value.apply(active);
        };
      }

      return value;
    },
  },
);

export type SheetFactory<Target> = () => Sheet<Target>;

export function setup<Theme extends __Theme__ = __Theme__, SheetTarget = unknown>(
  config?: TailwindConfig<Theme>,
  sheet?: Sheet<SheetTarget> | SheetFactory<SheetTarget>,
  target?: HTMLElement,
): RuntimeTW<Theme, SheetTarget>;

export function setup<
  Theme = __Theme__,
  Presets extends Preset<any>[] = Preset[],
  SheetTarget = unknown,
>(
  config?: TailwindUserConfig<Theme, Presets>,
  sheet?: Sheet<SheetTarget> | SheetFactory<SheetTarget>,
  target?: HTMLElement,
): RuntimeTW<__Theme__ & ExtractThemes<Theme, Presets>, SheetTarget>;

export function setup<Theme extends __Theme__ = __Theme__, Target = unknown>(
  config: TailwindConfig<any> | TailwindUserConfig<any> = { content: [] },
  sheet: Sheet<Target> | SheetFactory<Target> = getSheet as SheetFactory<Target>,
  target?: HTMLElement,
): RuntimeTW<Theme> {
  if ('destroy' in active) {
    active?.destroy(config as any);
  }
  // active = tw$ as RuntimeTW;
  const instance = createTailwind(
    config as TailwindUserConfig,
    typeof sheet == 'function' ? sheet() : sheet,
  );
  active = observe(instance, target);

  return active as unknown as RuntimeTW<Theme>;
}

export function observe<Theme extends __Theme__ = __Theme__>(
  tw$: RuntimeTW<Theme> = tw as unknown as RuntimeTW<Theme>,
  target: false | Node = typeof document != 'undefined' && document.documentElement,
): RuntimeTW<Theme> {
  if (target) {
    const observer = mutationObserver(tw$);

    observer.observe(target);

    // monkey patch tw.destroy to disconnect this observer
    const { destroy } = tw$;
    tw$.destroy = () => {
      observer.disconnect();
      destroy.call(tw$);
    };
  }

  return tw$;
}
