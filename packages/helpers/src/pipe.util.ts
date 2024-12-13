type Fn<Input, Output> = (i: Input) => Output;
type Pipe<Input, Output> = {
  pipe: <Output2>(fn: Fn<Output, Output2>) => Pipe<Input, Output2>;
  build: () => Fn<Input, Output>;
};

const Box = <A>(x: A) => {
  return {
    map: <B>(fnx: (x: A) => B) => Box(fnx(x)),
    fold: () => x,
    toString: () => `Box(${x})`,
    flatMap: <B>(fnx: (x: A) => B) => fnx(x),
  };
};

Box(1) //?
  .map((x) => x + 2)
  .flatMap((x) => Box(`${x * 3}`))
  .toString(); // ?
// .fold(); //?

export function pipeBuilder<Input, Output>(fn: Fn<Input, Output>): Pipe<Input, Output> {
  const fns: Fn<any, any>[] = [fn];
  const p: Pipe<any, any> = {
    pipe: (fn) => {
      fns.push(fn);
      return p;
    },
    build: () => {
      return (input) => fns.reduce((prev, curr) => curr(prev), input);
    },
  };
  return p;
}

export const builder = pipeBuilder((x: number) => x)
  .pipe((x) => x * 2)
  .pipe((x) => `${x}`)
  .pipe((x) => x)
  .build();

builder(1); // ?
