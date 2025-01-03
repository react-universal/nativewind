import type { Functor1 } from './Functor';

export type List<A> = Nil | Cons<A>;

export interface Nil {
  _tag: 'Nil';
}

export interface Cons<A> {
  _tag: 'Cons';
  head: A;
  tail: List<A>;
}

export const nil: List<never> = { _tag: 'Nil' };

export const cons = <A>(head: A, tail: List<A>): List<A> => ({
  _tag: 'Cons',
  head,
  tail,
});

export const isNil = <A>(xs: List<A>): xs is Nil => xs._tag === 'Nil';

export type Match = <A, B>(
  onNil: () => B,
  onCons: (head: A, tail: List<A>) => B,
) => (xs: List<A>) => B;

export const match: Match = (onNil, onCons) => (xs) =>
  isNil(xs) ? onNil() : onCons(xs.head, xs.tail);

export type Map = <A, B>(f: (x: A) => B) => (Fx: List<A>) => List<B>;

export const map: Map = (f) =>
  match(
    () => nil,
    (head, tail) => cons(f(head), map(f)(tail)),
  );

export const functor: Functor1<'List'> = {
  URI: 'List',
  map,
};

// const a = cons(1, cons(2, cons(3, cons(4, nil))));

// const reduceNumbersList = (a: List<number>, result = 0): number => {
//   if (isNil(a)) return result;

//   const newResult = a.head + result;

//   return reduceNumbersList(a.tail, newResult);
// };

// console.log(reduceNumbersList(a));

// const increment = (x: number) => x * 5;
// const numberToString = (x: number) => `number is: ${x}`;
// const incrementThenToString = compose(numberToString, increment);
// const mapNumbersList = map(incrementThenToString);

// console.log(a);
// console.log(mapNumbersList(a));
