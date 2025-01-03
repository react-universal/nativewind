import type { Either } from './Either';
import type { List } from './List';
import type { Option } from './Option';

declare module './HKT' {
  interface URItoKind<A> {
    List: List<A>;
    Option: Option<A>;
  }

  interface URItoKind2<E, A> {
    Either: Either<E, A>;
  }
}
