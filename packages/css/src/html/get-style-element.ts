export function getStyleElement(
  selector: string | null | undefined | false,
): HTMLStyleElement {
  let style = document.querySelector(selector || 'style[data-native-twin=""]');

  if (!style || style.tagName !== 'STYLE') {
    style = document.createElement('style');
    document.head.append(style);
  }
  (style as HTMLElement).dataset['nativeTwin'] = 'claimed';

  return style as HTMLStyleElement;
}
