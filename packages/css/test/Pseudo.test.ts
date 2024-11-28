import { generateStylesFor } from './test-utils.js';

describe.skip('@native-twin/css - Pseudo', () => {
  it('Complex', () => {
    const result = generateStylesFor('android:mx-10 ios:px-2');
    expect(result).toStrictEqual({
      base: { paddingLeft: 8, paddingRight: 8 },
      even: {},
      first: {},
      group: {},
      last: {},
      odd: {},
      pointer: {},
    });
  });
});
