import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';

export class DocumentCacheKey implements Equal.Equal {
  constructor(readonly n: string) {}

  [Hash.symbol](): number {
    return Hash.hash(this.n);
  }

  [Equal.symbol](u: unknown): boolean {
    return u instanceof DocumentCacheKey && this.n === u.n;
  }
}

export function getDocumentCacheKey(s: string): DocumentCacheKey {
  return new DocumentCacheKey(s);
}
