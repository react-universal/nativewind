import util from 'util';
import { CssResolver } from '../src/css/parser/css.parser.js';
import { createCssParserContext } from '../src/utils.parser.js';

export const inspectTestElement = (msg: string, target: string[], result: any) => {
  console.log(
    msg,
    util.inspect(
      {
        target,
        result,
      },
      false,
      null,
      true,
    ),
  );
};

export const injectClassNames = (classNames: string) => {
  const tailwind = {
    parseAndInject(classNames: string) {
      return {
        target: [],
        classNames,
      };
    },
  };
  const result = tailwind.parseAndInject(classNames);
  return result.target;
};

export const getTestParserData = (debug = false) => {
  const data = createCssParserContext({
    context: {
      debug,
      colorScheme: 'dark',
      deviceHeight: 1280,
      deviceWidth: 720,
      rem: 16,
      platform: 'ios',
    } as const,
    cache: {
      get: () => null,
      set: () => {},
    },
  });
  return data;
};

export const generateStylesFor = (classNames: string, debug = false) => {
  const target = injectClassNames(classNames);
  const parserData = getTestParserData(debug);
  const parsed = CssResolver(target, {
    ...parserData.context,
    // debug,
  });
  return parsed;
};
