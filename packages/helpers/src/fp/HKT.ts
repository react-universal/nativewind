export interface HKT<URI, A> {
  readonly _URI: URI;
  readonly _A: A;
}

export interface HKT2<URI, E, A> extends HKT<URI, A> {
  readonly _E: E;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface URItoKind<A> {}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface URItoKind2<E, A> {}

export type URIS = keyof URItoKind<any>;

export type URIS2 = keyof URItoKind2<any, any>;

export interface TypeLambda {
  readonly In: unknown;
  readonly Out2: unknown;
  readonly Out1: unknown;
  readonly Target: unknown;
}

export type Kind<URI extends URIS, A> = URI extends URIS ? URItoKind<A>[URI] : any;

export type Kind2<URI extends URIS2, E, A> = URI extends URIS2
  ? URItoKind2<E, A>[URI]
  : any;
