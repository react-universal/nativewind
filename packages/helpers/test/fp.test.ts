import { describe, expect, it } from 'vitest';
import * as E from '../src/fp/Either';
import * as Predicate from '../src/fp/Predicate';

type NumberToString = (x: number) => string;
const numberToString: NumberToString = (x) => `number ${x}`;

describe('FP test', () => {
  it('Either', () => {
    type IsEmail = (x: string) => boolean;
    const isEmail: IsEmail = (x) => x.includes('@');

    const lift = E.bifunctor.bimap(isEmail, numberToString);

    expect(lift(E.left('asd@mail.com'))).toStrictEqual(E.left(true));
    expect(lift(E.right(12))).toStrictEqual(E.right('number 12'));
  });

  it('Predicate', () => {
    type IsNumberEven = Predicate.Predicate<number>;
    const isNumberEven: IsNumberEven = (x) => x % 2 === 0;

    type Length = (str: string) => number;
    const length: Length = (str) => str.length;

    type LiftedLength = (x: Predicate.Predicate<number>) => Predicate.Predicate<string>;
    const liftedLength: LiftedLength = Predicate.contravariant.contramap(length);

    type IsStringEven = Predicate.Predicate<string>;
    const isStringEven: IsStringEven = liftedLength(isNumberEven);

    // Expect to be even
    expect(isStringEven('1234')).toBe(true);
    // Expect to be off
    expect(isStringEven('123')).toBe(false);
  });
});
