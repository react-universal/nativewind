declare let __webpack_nonce__: string;

export function getNonce() {
  return typeof __webpack_nonce__ !== 'undefined' ? __webpack_nonce__ : null;
}

/**
 * @description CSS Selector Escape
 * - Simplified escape testing only for chars that we know happen to be in tailwind directives
 * - If the character is the first character and is in the range [0-9] (2xl, ...)
     https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
 */
export function escapeSelector(string: string) {
  return (
    string
      // Simplified escape testing only for chars that we know happen to be in tailwind directives
      .replace(/[!"'`*+.,;:\\/<=>?@#$%&^|~()[\]{}]/g, '\\$&')
      // If the character is the first character and is in the range [0-9] (2xl, ...)
      // https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
      .replace(/^\d/, '\\3$& ')
  );
}

// spell-checker: disable
/** 
 * @description
 * Lets handle some special react cases:
   - arbitrary values for `content-`
     * `<span class="before:content-[&#x27;asas&#x27;]">`
     * `<span class="before:content-[&quot;asas&quot;]">`

   - self-referenced groups
     * `<span class="flex(&amp; col)">`

     If a class name contains `'`, `"`, or `&` those will be replaced with HTML entities
     To fix this we replace those for depending on the actual symbol that is being used
     As an alternative we could always escape class names direcly in tailwind like react does
     but this works for now
 * */
export function fixHTMLTagClassNamesList(value: string, quote: string): string {
  return (
    quote === `"`
      ? // `'` -> &#39; &apos; &#x27;
        value.replace(
          /(=|\[)(?:&#39;|&apos;|&#x27;)|(?:&#39;|&apos;|&#x27;)(])/g,
          `$1'$2`,
        )
      : quote === `'`
        ? // `"` -> &#34; &quot; &#x22;
          value.replace(
            /(=|\[)(?:&#34;|&quot;|&#x22;)|(?:&#34;|&quot;|&#x22;)(])/g,
            `$1"$2`,
          )
        : value
  ).replace(/(&#38;|&amp;|&#x26;)/g, '&');
}

/**
 * Determines if two class name strings contain the same classes.
 *
 * @param a first class names
 * @param b second class names
 * @returns are they different
 */
export function compareClassNames(a: string, b: string): boolean {
  return a !== b && `${a.split(' ').sort()}` !== `${b.split(' ').sort()}`;
}
