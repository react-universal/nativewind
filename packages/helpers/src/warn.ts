declare const __DEV__: boolean;

export interface WarningEventMap {
  TW_INVALID_CLASS: string;
  TW_INVALID_CSS: string;
}

export function warn<Code extends keyof WarningEventMap>(
  message: string,
  code: Code,
  detail: WarningEventMap[Code],
): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (typeof dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      // Browser
      const event = new CustomEvent('warning', {
        detail: { message, code, detail },
        cancelable: true,
      });

      dispatchEvent(event);

      if (!event.defaultPrevented) {
        console.warn(`[${code}] ${message}`, { detail });
      }
    } else if (typeof process === 'object' && typeof process.emitWarning === 'function') {
      // Node.JS
      process.emitWarning(message, { code, detail } as unknown as string);
    } else {
      // Fallback
      console.warn(`[${code}] ${message}`, { detail });
    }
  }
}
