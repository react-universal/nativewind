import { parseTWTokens, parsedRuleToClassName } from '../src/index.js';

describe('@native-twin/core - Raw rules parser', () => {
  it('Parse regular rules', () => {
    const result = parseTWTokens('bg-blue-300 xl:bg-white hover:text-2xl');
    expect(result).toStrictEqual([
      {
        n: 'bg-blue-300',
        v: [],
        i: false,
        m: null,
        p: 0,
      },
      {
        n: 'bg-white',
        v: ['xl'],
        i: false,
        m: null,
        p: 0,
      },
      {
        n: 'text-2xl',
        v: ['hover'],
        i: false,
        m: null,
        p: 0,
      },
    ]);
  });
  it('Parse grouped rules', () => {
    const result = parseTWTokens('hover:focus:(bg-pink-200)');
    expect(result).toStrictEqual([
      {
        n: 'bg-pink-200',
        v: ['hover', 'focus'],
        i: false,
        m: null,
        p: 0,
      },
    ]);
  });

  it('Parse arbitrary pseudo', () => {
    const result = parseTWTokens('flex-row [nth-of-type(2)&]:(bg-blue)');
    expect(result).toStrictEqual([
      {
        n: 'flex-row',
        v: [],
        i: false,
        m: null,
        p: 0,
      },
      {
        n: 'bg-blue',
        v: ['[nth-of-type(2)&]'],
        i: false,
        m: null,
        p: 0,
      },
    ]);
  });

  it('Parse nested grouped rules', () => {
    const result = parseTWTokens('md:(!bg-black !sm:(bg-blue-200 h-24))');
    const classNames = result.map(parsedRuleToClassName);
    expect(classNames).toStrictEqual([
      'md:!bg-black',
      'sm:md:!bg-blue-200',
      'sm:md:!h-24',
    ]);
    expect(result).toStrictEqual([
      { n: 'bg-black', v: ['md'], i: true, m: null, p: 0 },
      { n: 'bg-blue-200', v: ['sm', 'md'], i: true, m: null, p: 0 },
      { n: 'h-24', v: ['sm', 'md'], i: true, m: null, p: 0 },
    ]);
  });
});
