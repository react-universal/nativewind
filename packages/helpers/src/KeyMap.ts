import { dual, pipe } from 'effect/Function';
import * as Option from 'effect/Option';

export interface KeyMap<K, V> extends Map<K, V> {}

export const get = dual<
  <K1>(key: K1) => <K, V>(self: KeyMap<K, V>) => Option.Option<V>,
  <K, V, K1 extends K>(self: KeyMap<K, V>, key: K1) => Option.Option<V>
>(2, (self, key) => Option.fromNullable(self.get(key)));

/**
 * Unsafe unwrap the return value
 * @throws an exception in case the key is not present
 * */
export const unsafeGet = dual<
  <K1>(key: K1) => <K, V>(self: KeyMap<K, V>) => V,
  <K, V, K1 extends K>(self: KeyMap<K, V>, key: K1) => V
>(2, (self, key) => {
  return pipe(
    get(self, key),
    Option.getOrThrowWith(() => new Error(`Expected map to contains key${key}`)),
  );
});

export const getOrNull = dual<
  <K1>(key: K1) => <K, V>(self: KeyMap<K, V>) => V | null,
  <K, V, K1 extends K>(self: KeyMap<K, V>, key: K1) => V | null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
>(2, (self, key) => self.get(key) ?? null);

export const set = dual<
  <K, V>(key: K, value: V) => (self: KeyMap<K, V>) => KeyMap<K, V>,
  <K, V>(self: KeyMap<K, V>, key: K, value: V) => KeyMap<K, V>
>(3, (self, key, value) => self.set(key, value));

export const size = <K, V>(self: KeyMap<K, V>): number => self.size;

export const make = <K, V>(): KeyMap<K, V> => new Map<K, V>();
