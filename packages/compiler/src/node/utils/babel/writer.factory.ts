import CodeBlockWriter from 'code-block-writer';
import * as RA from 'effect/Array';
import { apply, flip, pipe } from 'effect/Function';
import * as Predicate from 'effect/Predicate';
import type { AnyPrimitive } from '@native-twin/helpers';

export function expressionFactory(writer: CodeBlockWriter) {
  const curried = {
    object: curryWriter(objectWriter),
    objectProperty: curryWriter(createKeyValuePair),
    primitive: curryWriter(createPrimitive),
    identifier: curryWriter(createIdentifier),
    nextToken: curryWriter(createNextToken),
    array: curryWriter(arrayWriter),
    writer,
  };

  return curried;

  function curryWriter<A>(cb: (a: CodeBlockWriter) => A) {
    return pipe(cb, apply(writer));
  }

  function createNextToken(writer: CodeBlockWriter) {
    return <A>(x: A) => {
      if (isStringLiteral(x)) {
        return curried.identifier(x);
      }
      if (isPrimitive(x)) {
        return curried.primitive(x);
      }
      if (RA.isArray(x)) return curried.array(x);
      if (Predicate.isRecord(x)) return curried.object(x);
      if (Predicate.isNullable(x)) return curried.identifier(`${x}`);
      return writer;
    };
  }

  function createIdentifier(writer: CodeBlockWriter) {
    return (x: AnyPrimitive) => {
      return writer.write(`${x}`);
    };
  }

  function createPrimitive(writer: CodeBlockWriter) {
    return (primitive: AnyPrimitive) => {
      if (typeof primitive === 'string') {
        return writer.quote(primitive);
      }
      return writer.write(`${primitive}`);
    };
  }

  function createKeyValuePair(writer: CodeBlockWriter) {
    return ([key, value]: [key: string, value: any]) => {
      return writer.hangingIndent(() =>
        pipe(writer.write(key).write(':').space(), flip(createNextToken)(value)),
      );
    };
  }

  function arrayWriter(writer: CodeBlockWriter) {
    return <A extends any[]>(arrayValue: A) => {
      return pipe(
        writer.write('['),
        (w) =>
          pipe(
            arrayValue,
            RA.forEach((ww, i) => {
              curried.nextToken(ww).conditionalWrite(i + 1 < arrayValue.length, ',');
            }),
            () => w,
          ),
        (w) => w.write(']'),
      );
    };
  }

  function objectWriter(writer: CodeBlockWriter) {
    return <A extends object>(object: A) => {
      const entries = pipe(
        object,
        Object.entries,
        RA.filter((x) => !Predicate.isFunction(x[1]) && !Predicate.isPromise(x[1])),
      );

      return writer.block(() => {
        pipe(
          entries,
          RA.forEach((x, i) => {
            pipe(x, curried.objectProperty, (w) =>
              w
                .conditionalWrite(i + 1 < entries.length, ',')
                .conditionalNewLine(i < entries.length),
            );
          }),
        );
      });
    };
  }
}

interface StringLiteralBrand {
  readonly StringLiteral: unique symbol;
}
type StringLiteral = string & StringLiteralBrand;

const isStringLiteralLike: Predicate.Refinement<string, StringLiteral> = (
  s,
): s is StringLiteral => s.startsWith('`');

const isStringLiteral = pipe(Predicate.isString, Predicate.compose(isStringLiteralLike));
const isStringOrNumber = Predicate.or(Predicate.isString, Predicate.isNumber);
const isPrimitive = Predicate.or(isStringOrNumber, Predicate.isBoolean);
