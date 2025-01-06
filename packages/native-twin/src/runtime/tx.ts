import type { CSSValue, SheetEntry } from '@native-twin/css';
import { interpolate } from '@native-twin/css';
import { tw as tw$ } from './tw.js';

export interface TxFunction {
  (...classes: CSSValue[]): SheetEntry[];

  (strings: TemplateStringsArray, ...interpolations: readonly CSSValue[]): SheetEntry[];

  bind(thisArg?: ((tokens: string) => SheetEntry[]) | undefined | void): TxFunction;

  call(
    thisArg: ((tokens: string) => SheetEntry[]) | undefined | void,
    ...classes: CSSValue[]
  ): SheetEntry[];
  call(
    thisArg: ((tokens: string) => string) | undefined | void,
    strings: TemplateStringsArray,
    ...interpolations: readonly CSSValue[]
  ): string;

  apply(
    thisArg: ((tokens: string) => SheetEntry[]) | undefined | void,
    classes:
      | CSSValue[]
      | [strings: TemplateStringsArray, ...interpolations: readonly CSSValue[]],
  ): SheetEntry[];
}

export const tx: TxFunction = function tx(
  this: ((tokens: string) => SheetEntry[]) | undefined | void,
  strings: TemplateStringsArray | CSSValue,
  ...interpolations: CSSValue[]
): SheetEntry[] {
  const tw = typeof this === 'function' ? this : tw$;
  return tw(interpolate(strings, interpolations))!;
};
