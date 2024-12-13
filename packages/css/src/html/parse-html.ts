// For now we are using a simple parser adapted from htm (https://github.com/developit/htm/blob/master/src/build.mjs)
// If we find any issues we can switch to something more sophisticated like
// - https://github.com/acrazing/html5parser
// - https://github.com/fb55/htmlparser2

const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_COMMENT = 4;
const MODE_ATTRIBUTE = 5;

export function parseHTML(
  markup: string,
  onClass: (startIndex: number, endIndex: number, quote: string) => false | unknown,
): void {
  let mode = MODE_TEXT;
  let startIndex = 0;
  let quote = '';
  let attributeName = '';

  const commit = (currentIndex: number): void => {
    if (mode === MODE_ATTRIBUTE && attributeName === 'class') {
      if (onClass(startIndex, currentIndex, quote) === false) {
        markup = '';
      }
    }
  };

  for (let position = 0; position < markup.length; position++) {
    const char = markup[position];

    if (mode === MODE_TEXT) {
      if (char === '<') {
        mode = markup.substr(position + 1, 3) === '!--' ? MODE_COMMENT : MODE_TAGNAME;
      }
    } else if (mode === MODE_COMMENT) {
      // Ignore everything until the last three characters are '-', '-' and '>'
      if (char === '>' && markup.slice(position - 2, position) === '--') {
        mode = MODE_TEXT;
      }
    } else if (quote) {
      if (char === quote && markup[position - 1] !== '\\') {
        commit(position);
        mode = MODE_WHITESPACE;
        quote = '';
      }
    } else if (char === '"' || char === "'") {
      quote = char;
      startIndex += 1;
    } else if (char === '>') {
      commit(position);
      mode = MODE_TEXT;
    } else if (!mode) {
      // MODE_SLASH
      // Ignore everything until the tag ends
    } else if (char === '=') {
      attributeName = markup.slice(startIndex, position);
      mode = MODE_ATTRIBUTE;
      startIndex = position + 1;
    } else if (char === '/' && (mode < MODE_ATTRIBUTE || markup[position + 1] === '>')) {
      commit(position);
      mode = MODE_SLASH;
    } else if (/\s/.test(char!)) {
      // <a class=font-bold>
      commit(position);
      mode = MODE_WHITESPACE;
      startIndex = position + 1;
    }
  }
}
