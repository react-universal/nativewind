import type { SheetEntry, TWScreenValueConfig } from '@native-twin/css';
import type {
  ArrayType,
  ColorsRecord,
  MaybeArray,
  StringLike,
  UnionToIntersection,
} from '@native-twin/helpers';
import type { Preset, TailwindConfig, ThemeFunction } from './config.types.js';

export interface RuntimeTW<Theme extends __Theme__ = __Theme__, Target = unknown> {
  (tokens: StringLike): SheetEntry[];
  readonly theme: ThemeFunction<Theme>;
  readonly config: TailwindConfig<Theme>;
  readonly target: Target;
  destroy: (nextConfig?: TailwindConfig<Theme>) => void;
  snapshot: () => () => void;
  clear: () => void;
  observeConfig: (cb: (config: TailwindConfig<Theme>) => void) => () => void;
  insertPreflight(manual?: boolean): void;
  subscriptions: Set<(cb: TailwindConfig<any>) => void>;
  version: number;
}

/* THEME CONFIG */
export type ThemeValue<T> = T extends Record<string, infer V>
  ? Exclude<V, Record<string, V>>
  : T;

export type PartialTheme<Theme extends object = object> = {
  [Section in keyof Theme]?: Theme[Section];
};

export type ThemeConfig<Theme extends object = object> = PartialTheme<Theme> & {
  extend?: PartialTheme<Theme>;
};

export interface ThemeAnimation {
  keyframes?: Record<string, string>;
  durations?: Record<string, string>;
  timingFns?: Record<string, string>;
  properties?: Record<string, object>;
  counts?: Record<string, string | number>;
}

export interface __Theme__ {
  screens?: Record<string, TWScreenValueConfig>;
  colors?: ColorsRecord;
  animations?: Record<string, string>;
}

export interface ThemeSectionResolverContext<Theme extends __Theme__ = __Theme__> {
  readonly colors: Theme['colors'];

  readonly theme: ThemeFunction<ExtractUserTheme<Theme>>;
  /**
   * No-op function as negated values are automatically inferred and do _not_ need to be in the theme.
   */
  readonly negative: (scale: Record<string, string>) => Record<string, string>;
  readonly breakpoints: (
    screens: Record<string, MaybeArray<TWScreenValueConfig>>,
  ) => Record<string, string>;
}

export type ThemeSectionResolver<Value, Theme extends __Theme__ = __Theme__> = (
  context: ThemeSectionResolverContext<Theme>,
) => Value;

export type ExtractTheme<T> = T extends Preset<infer Theme> ? Theme : T;

export type ExtractUserTheme<T> = {
  [key in keyof T]: key extends 'extend'
    ? never
    : T[key] extends ThemeSectionResolver<infer Value, T & __Theme__>
      ? Value
      : T[key];
} & __Theme__;

export type ExtractThemes<Theme, Presets extends Preset<any>[]> = UnionToIntersection<
  ExtractTheme<ExtractUserTheme<Theme> | __Theme__ | ArrayType<Presets>>
>;
