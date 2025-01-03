import type { Contravariant1 } from './Contravariant';
import { compose } from './compose';

declare module './HKT' {
  interface URItoKind<A> {
    Predicate: Predicate<A>;
  }
}

export type Predicate<A> = (a: A) => boolean;

export const contravariant: Contravariant1<'Predicate'> = {
  URI: 'Predicate',
  contramap: (f) => (predicateA) => compose(predicateA, f),
};
