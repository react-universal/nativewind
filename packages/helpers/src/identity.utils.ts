export const asNumber = (x: string) => Number(x);

export const asString = <T>(x: T) => String(x);

export function asRegExp(value: string | RegExp): RegExp {
  return typeof value === 'string'
    ? new RegExp(`^${value}${value.includes('$') || value.slice(-1) === '-' ? '' : '$'}`)
    : value;
}

export function asArray<T>(value: T | T[] = []): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export const identity = <A>(a: A): A => a;

export function keysOf<Obj extends object>(obj: Obj): (keyof Obj)[] {
  return Object.keys(obj) as (keyof Obj)[];
}
