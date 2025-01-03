import type { HKT, Kind, Kind2, URIS, URIS2 } from './HKT';

export interface Contravariant<F> {
  URI: F;
  contramap: <A, B>(f: (b: B) => A) => (fa: HKT<F, A>) => HKT<F, B>;
}

export interface Contravariant1<F extends URIS> {
  URI: F;
  contramap: <A, B>(f: (b: B) => A) => (fa: Kind<F, A>) => Kind<F, B>;
}

export interface Contravariant2<F extends URIS2> {
  URI: F;
  contramap: <E, A, B>(f: (b: B) => A) => (fa: Kind2<F, E, A>) => Kind2<F, E, B>;
}

