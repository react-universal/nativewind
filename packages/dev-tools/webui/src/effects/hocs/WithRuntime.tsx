import type * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { type FC, memo, useContext, useEffect, useRef, useState } from 'react';
import type { RuntimeContext } from '../context/runtime.context';

export function WithRuntime<T>(Context: RuntimeContext<T>) {
  return <P extends object>(Component: FC<P>) => {
    const Wrapped = (props: P) => {
      const layer = useContext(Context) as unknown as Layer.Layer<T>;
      const runtime = useRuntimeFactory(layer);

      return (
        <Context.Provider value={runtime}>
          <Component {...props} />
        </Context.Provider>
      );
    };
    Wrapped.displayName = 'WithRuntime';
    return memo(Wrapped);
  };
}

/*
This hook creates a runtime and disposes it when the component is unmounted.
It is used by withRuntime to create a runtime for the context.
*/

const useRuntimeFactory = <T,>(layer: Layer.Layer<T>) => {
  const disposed = useRef(false);
  const [runtime, setRuntime] = useState(() => ManagedRuntime.make(layer));

  useEffect(() => {
    if (disposed.current) {
      setRuntime(() => ManagedRuntime.make(layer));
      disposed.current = false;
    }

    return () => {
      void runtime.dispose();
      disposed.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  return runtime;
};
