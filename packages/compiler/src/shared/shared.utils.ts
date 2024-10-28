export function assertString(x: unknown): asserts x is string {
  if (typeof x !== 'string') throw new Error('Value is not defined');
}
