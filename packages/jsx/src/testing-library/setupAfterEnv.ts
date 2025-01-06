import { expect } from '@jest/globals';
import matchers from 'expect/build/matchers';

require('react-native-reanimated').setUpTests();

matchers.customTesters = [];

expect.extend({
  toHaveStyle(received, style) {
    const receivedStyle = received?.props?.style
      ? Object.fromEntries(Object.entries(received?.props?.style))
      : undefined;
    return matchers.toEqual(receivedStyle, style);
  },
});
