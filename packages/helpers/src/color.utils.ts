/**
 * Converts the given input to a color value.
 * @param {string} color - The input to be converted to a color value.
 * @returns {string} - The resulting color value.
 *
 * @example
 * // returns "#FFFFFF"
 * toColorValue(255, 255, 255);
 */
export function toColorValue(
  color: string,
  options = {
    opacityValue: '1',
  },
): string {
  if (color[0] === '#' && (color.length === 4 || color.length === 7)) {
    color = color.replace('#', '');
    const r = Number.parseInt(
      color.length === 3 ? color.slice(0, 1).repeat(2) : color.slice(0, 2),
      16,
    );
    const g = Number.parseInt(
      color.length === 3 ? color.slice(1, 2).repeat(2) : color.slice(2, 4),
      16,
    );
    const b = Number.parseInt(
      color.length === 3 ? color.slice(2, 3).repeat(2) : color.slice(4, 6),
      16,
    );
    return `rgba(${[r, g, b, options.opacityValue]})`;
  }

  if (options.opacityValue === '1') return color;

  if (options.opacityValue === '0') return '#0000';
  return color.replace(/^(rgb|hsl)(\([^)]+)\)$/, `$1a$2,${options.opacityValue})`);
}
