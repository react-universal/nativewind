export function createStore<StoreShape>(initialState: StoreShape) {
  let currentState = initialState;

  const listeners = new Set<(state: StoreShape) => void>();

  return {
    setState,
    getState,
    emitChanges: forceEmit,
    subscribe,
  };

  function subscribe(listener: (state: StoreShape) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setState(fn: (state: StoreShape) => StoreShape) {
    currentState = fn(currentState);
    listeners.forEach((listener) => listener(currentState));
  }

  function getState() {
    return currentState;
  }

  function forceEmit() {
    listeners.forEach((listeners) => listeners(currentState));
  }
}

export interface ValueStoreOptions<StoreName extends string> {
  name: StoreName;
}

export interface ValueStore<StoreName extends string, StoreShape> {
  name: StoreName;
  get(): StoreShape;
  set(fn: (shape: Partial<StoreShape>, publish?: boolean) => StoreShape): void;
  subscribe(listener: (state: StoreShape) => void): void;
}
export function createValueStore<StoreName extends string, StoreShape>(
  initialState: StoreShape,
  options: ValueStoreOptions<StoreName>,
): ValueStore<StoreName, StoreShape> {
  const store = createStore(initialState);
  return {
    name: options.name,
    get: store.getState,
    set: store.setState,
    subscribe: store.subscribe,
  };
}
