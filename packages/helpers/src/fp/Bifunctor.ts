import type { HKT2, Kind2, URIS2 } from './HKT';

export interface Bifunctor<F> {
  URI: F;
  bimap: <A, B, C, D>(
    f: (a: A) => C,
    g: (b: B) => D,
  ) => (fab: HKT2<F, A, B>) => HKT2<F, C, D>;
}

export interface Bifunctor2<F extends URIS2> {
  URI: F;
  bimap: <A, B, C, D>(
    f: (a: A) => C,
    g: (b: B) => D,
  ) => (fab: Kind2<F, A, B>) => Kind2<F, C, D>;
}
