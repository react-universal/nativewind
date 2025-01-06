import * as P from '../src';

type AnyType = string | number | boolean | number | null | object | AnyType[];

const JSONValue: P.Parser<AnyType> = P.recursiveParser(() =>
  P.choice([stringParser, numberValue, booleanValue, nullValue, arrayParser, JSONParser]),
);

const scaped = P.sequenceOf([P.literal('\\'), P.char('"')]).map((x) => x[1]);
const stringParser = P.between(P.char('"'))(P.char('"'))(
  P.many1(P.choice([scaped, P.alphanumeric, P.anythingExcept(P.char('"'))])),
).map((x) => x.join(''));

const numberValue = P.float.map((x) => Number(x));

const nullValue = P.literal('null').map(() => null);

const booleanValue = P.choice([P.literal('true'), P.literal('false')]).map(
  (x) => x === 'true',
);

const JSONKeyValue = P.sequenceOf([
  stringParser,
  P.whitespaceSurrounded(P.char(':')),
  JSONValue,
]).map((x) => [[x[0]], x[2]]);

const arrayParser: P.Parser<AnyType[]> = P.between(P.char('['))(P.char(']'))(
  P.separatedBySpacedComma(JSONValue),
);

const JSONParser = P.betweenSpacedBrackets(P.separatedBySpacedComma(JSONKeyValue)).map(
  Object.fromEntries,
);

const parsThisFuckJSON = (data: string) => {
  return JSONValue.run(data);
};

const test1 = `
{
  "name": "@native-twin/arc-parser",
  "version": "6.0.1",
  "description": "Parser combinators library",
  "homepage": "https://github.com/react-universal/native-twin#readme",
  "bugs": {
    "url": "https://github.com/react-universal/native-twin/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/react-universal/native-twin",
    "directory": "packages/arc-parser"
  },
  "license": "MIT",
  "author": "Cristhian Gutierrez",
  "sideEffects": false,
  "main": "build/index.js",
  "types": "build/index.d.ts",
  "scripts": {
    "build": "yarn twin build",
    "clean": "rm -rf build",
    "dev": "tsc -p tsconfig.build.json --watch --preserveWatchOutput",
    "lint": "eslint \\"./**/*.{ts,tsx}\\"",
    "test": "jest"
  },
  "optionalDependencies": {
    "jest": "*"
  },
  "publishConfig": {
    "access": "public",
    "directory": "_release/package"
  }
}

`;


describe('JSON parser', () => {
  it('Parse package.json', () => {
    const result = parsThisFuckJSON(test1); //?
    expect(result.isError).toBeFalsy();
    if (!result.isError) {
      expect(result.result).toStrictEqual(JSON.parse(test1));
    }
  });
});

// const getObject = (token: JsonObject | AnyToken): any => {
//   if (token.type === 'OBJECT') return fromObject(token);
//   if (token.type === 'ARRAY') {
//     return fromArray(token);
//   }

//   return token.value;

//   function fromObject(token: JsonObject) {
//     const tuples = token.value.map((x) => [x[0], getObject(x[1])]);
//     return Object.fromEntries(tuples);
//   }
//   function fromArray(token: ArrayToken): any[] {
//     return token.value.map((x) => getObject(x));
//   }
// };
// if (!result.isError) {
//   getObject(result.result);
// }
