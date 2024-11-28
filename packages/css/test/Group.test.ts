import { generateStylesFor } from './test-utils.js';

describe.skip('@native-twin/css - GROUP', () => {
  it('Complex', () => {
    const result = generateStylesFor(
      [
        'hover:(web:(bg-blue-600) ios:(bg-green-600) android:(bg-black))',
        'ios:(p-14 bg-rose-200 border-white border-2)',
        'android:(p-14 border-green-200 border-2 bg-gray-200)',
        'md:border-3',
        'group-hover:text-2xl hover:text-3xl',
        'odd:bg-black even:bg-black',
        'first:bg-black last:bg-black',
        'dark:bg-blue-200',
      ].join(' '),
      true,
    );
    expect(result).toStrictEqual({
      base: {
        padding: 56,
        backgroundColor: 'rgba(191,219,254,1)',
        borderColor: 'rgba(255,255,255,1)',
        borderWidth: 2,
      },
      even: { backgroundColor: 'rgba(0,0,0,1)' },
      first: { backgroundColor: 'rgba(0,0,0,1)' },
      group: { fontSize: 24, lineHeight: 32 },
      last: { backgroundColor: 'rgba(0,0,0,1)' },
      odd: { backgroundColor: 'rgba(0,0,0,1)' },
      pointer: {
        fontSize: 30,
        lineHeight: 36,
        backgroundColor: 'rgba(22,163,74,1)',
      },
    });
  });
});
