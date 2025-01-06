import { generateStylesFor } from './test-utils.js';

describe.skip('@native-twin/css - Unsupported', () => {
  it('Grid', () => {
    const result = generateStylesFor(
      'grid-cols-1 col-span-1 row-span-2 auto-cols-min auto-rows-min',
      true,
    );
    expect(result).toStrictEqual({});
  });
});
