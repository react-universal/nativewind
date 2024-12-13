import type { __Theme__ } from '@native-twin/core';
import * as ReadonlyArray from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import { TSPluginService } from '../plugin/TSPlugin.service';
import { createRuleClassNames, createRuleCompositions } from './nativeTwin.rules';
import type { TwinRuleWithCompletion, VariantCompletionToken } from './nativeTwin.types';

export class NativeTwinService extends Context.Tag('plugin/IntellisenseService')<
  NativeTwinService,
  {
    store: {
      twinVariants: HashSet.HashSet<VariantCompletionToken>;
      twinRules: HashSet.HashSet<TwinRuleWithCompletion>;
    };
  }
>() {}

export const NativeTwinServiceLive = Layer.scoped(
  NativeTwinService,
  Effect.gen(function* ($) {
    const { tailwind } = yield* $(TSPluginService);
    const theme = { ...tailwind.tw.config.theme };
    const themeSections = new Set(Object.keys({ ...theme, ...theme.extend }).sort());
    themeSections.delete('theme');
    themeSections.delete('extend');
    let nextIndex = 0;
    // let position = 0;
    const currentConfig = tailwind.config;
    const variants = Object.entries({
      ...currentConfig.theme.screens,
      ...currentConfig.theme.extend?.screens,
    });
    const colorPalette = tailwind.context.colors;

    const twinRules: HashSet.HashSet<TwinRuleWithCompletion> = pipe(
      ReadonlyArray.fromIterable(tailwind.tw.config.rules),
      ReadonlyArray.map((x) => createRuleCompositions(x)),
      ReadonlyArray.flatten,
      ReadonlyArray.map((x) => {
        const values =
          x.parts.themeSection === 'colors'
            ? colorPalette
            : (tailwind.context.theme(x.parts.themeSection as keyof __Theme__) ?? {});
        return createRuleClassNames(values, x.composition, x.parts).map(
          (className): TwinRuleWithCompletion => ({
            completion: className,
            composition: x.composition,
            rule: x.parts,
          }),
        );
      }),
      ReadonlyArray.flatten,
      ReadonlyArray.sortBy((x, y) =>
        x.completion.className > y.completion.className ? 1 : -1,
      ),
      HashSet.fromIterable,
    );

    const twinVariants = HashSet.fromIterable(variants).pipe(
      HashSet.map((variant) => {
        return {
          kind: 'variant',
          name: `${variant[0]}:`,
          value: variant[1],
          index: nextIndex++,
          position: nextIndex,
        } as const;
      }),
    );

    return NativeTwinService.of({
      store: {
        twinVariants,
        twinRules,
      },
    });
  }),
);
