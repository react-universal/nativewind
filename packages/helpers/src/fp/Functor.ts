import type { HKT, Kind, Kind2, URIS, URIS2 } from './HKT';

export interface Functor<F> {
  URI: F;
  map: <A, B>(f: (x: A) => B) => (fa: HKT<F, A>) => HKT<F, B>;
}

export interface Functor1<F extends URIS> {
  URI: F;
  map: <A, B>(f: (x: A) => B) => (fa: Kind<F, A>) => Kind<F, B>;
}

export interface Functor2<F extends URIS2> {
  URI: F;
  map: <E, A, B>(f: (x: A) => B) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
}

export function lift<F extends URIS>(
  F: Functor1<F>,
): <A, B>(f: (x: A) => B) => (fa: Kind<F, A>) => Kind<F, B>;
export function lift<F extends URIS2>(
  F: Functor2<F>,
): <E, A, B>(f: (x: A) => B) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
export function lift<F>(
  F: Functor<F>,
): <A, B>(f: (x: A) => B) => (fa: HKT<F, A>) => HKT<F, B>;
export function lift<F>(
  F: Functor<F>,
): <A, B>(f: (x: A) => B) => (fa: HKT<F, A>) => HKT<F, B> {
  return (f) => (fa) => F.map(f)(fa);
}

// type Increment = (x: number) => number;
// const increment: Increment = (x) => x + 1;

// const liftIncrement = lift(functor)(increment);
// liftIncrement(some(2)); //?
// liftIncrement(none); //?
// const maybeNumber: Option<number> = some(12);
// const maybeNumberNone: Option<number> = none;

// const foldNumber = (x: Option<number>) =>
//   match(
//     () => 0,
//     (v: number) => v,
//   )(x);

// foldNumber(maybeNumberNone); // ?
