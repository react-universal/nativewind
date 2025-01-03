import type { Bifunctor2 } from './Bifunctor';
import type { Functor2 } from './Functor';

export type Either<E, A> = Left<E> | Right<A>;

export interface Left<E> {
  _tag: 'Left';
  readonly left: E;
}

export interface Right<A> {
  _tag: 'Right';
  readonly right: A;
}

export const left = <E, A = never>(e: E): Either<E, A> => ({
  _tag: 'Left',
  left: e,
});

export const right = <A, E = never>(a: A): Either<E, A> => ({
  _tag: 'Right',
  right: a,
});

export const isLeft = <E, A>(x: Either<E, A>): x is Left<E> => x._tag === 'Left';

export type Match = <E, A, B>(
  onLeft: (e: E) => B,
  onRight: (a: A) => B,
) => (x: Either<E, A>) => B;

export const match: Match = (onLeft, onRight) => (x) =>
  isLeft(x) ? onLeft(x.left) : onRight(x.right);

export type Map = <E, A, B>(f: (x: A) => B) => (Fx: Either<E, A>) => Either<E, B>;

export const map: Map = (f) =>
  match(
    (e) => left(e),
    (a) => right(f(a)),
  );

export const functor: Functor2<'Either'> = {
  URI: 'Either',
  map: (f) =>
    match(
      (e) => left(e),
      (a) => right(f(a)),
    ),
};

export const bifunctor: Bifunctor2<'Either'> = {
  URI: 'Either',
  bimap: (f, g) =>
    match(
      (a) => left(f(a)),
      (b) => right(g(b)),
    ),
};

// const leftV: Either<string, string> = left('Left_Error');
// const rightV: Either<string, string> = right('Right_Value');

// const mapL = map((x: string): Number => Number(x));
// const mapLV = functor.map(mapL)(leftV); // ?
// const mapRV = functor.map(mapL)(rightV); // ?
