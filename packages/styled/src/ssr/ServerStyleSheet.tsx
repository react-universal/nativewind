// @ts-nocheck
import type * as streamInternal from 'stream';
import type { Readable } from 'stream';
import { type Sheet, type SheetEntry, createVirtualSheet } from '@native-twin/core';
import { getNonce } from '@native-twin/helpers';
import { IS_BROWSER, SC_ATTR, SC_ATTR_VERSION, SC_VERSION } from '../constants/ssr.js';

declare const __SERVER__: boolean;

const CLOSING_TAG_R = /^\s*<\/[a-z]/i;

export default class ServerStyleSheet {
  instance: Sheet<SheetEntry[]>;
  sealed: boolean;

  constructor() {
    this.instance = createVirtualSheet();
    this.sealed = false;
  }

  _emitSheetCSS = (): string => {
    const css = this.instance.toString();
    const nonce = getNonce();
    const attrs = [
      nonce && `nonce="${nonce}"`,
      `${SC_ATTR}="true"`,
      `${SC_ATTR_VERSION}="${SC_VERSION}"`,
    ];
    const htmlAttr = (attrs.filter(Boolean) as string[]).join(' ');

    return `<style ${htmlAttr}>${css}</style>`;
  };

  collectStyles(children: any): JSX.Element {
    if (this.sealed) {
      throw new Error('SEALED_SHEET');
    }
    // @ts-expect-error
    return <div>{children}</div>;
  }

  getStyleTags = (): string => {
    if (this.sealed) {
      throw new Error('SEALED_SHEET');
    }

    return this._emitSheetCSS();
  };

  getStyleElement = () => {
    if (this.sealed) {
      throw new Error('SEALED_SHEET');
    }

    const props = {
      [SC_ATTR]: '',
      [SC_ATTR_VERSION]: SC_VERSION,
      dangerouslySetInnerHTML: {
        __html: this.instance.toString(),
      },
    };

    const nonce = getNonce();
    if (nonce) {
      (props as any).nonce = nonce;
    }

    // v4 returned an array for this fn, so we'll do the same for v5 for backward compat
    return [<style {...props} key='sc-0-0' />];
  };

  // @ts-expect-error alternate return types are not possible due to code transformation
  interleaveWithNodeStream(input: Readable): streamInternal.Transform {
    if (!__SERVER__ || IS_BROWSER) {
      throw new Error('IS_BROWSER');
    } else if (this.sealed) {
      throw new Error('SEALED_SHEET');
    }

    if (__SERVER__) {
      this.seal();

      const { Transform } = require('stream');

      const readableStream: Readable = input;
      const { instance: sheet, _emitSheetCSS } = this;

      const transformer: streamInternal.Transform = new Transform({
        transform: function appendStyleChunks(
          chunk: string,
          /* encoding */
          _: string,
          callback: Function,
        ) {
          // Get the chunk and retrieve the sheet's CSS as an HTML chunk,
          // then reset its rules so we get only new ones for the next chunk
          const renderedHtml = chunk.toString();
          const html = _emitSheetCSS();

          sheet.destroy();

          // prepend style html to chunk, unless the start of the chunk is a
          // closing tag in which case append right after that
          if (CLOSING_TAG_R.test(renderedHtml)) {
            const endOfClosingTag = renderedHtml.indexOf('>') + 1;
            const before = renderedHtml.slice(0, endOfClosingTag);
            const after = renderedHtml.slice(endOfClosingTag);

            this.push(before + html + after);
          } else {
            this.push(html + renderedHtml);
          }

          callback();
        },
      });

      readableStream.on('error', (err) => {
        // forward the error to the transform stream
        transformer.emit('error', err);
      });

      return readableStream.pipe(transformer);
    }
  }

  seal = (): void => {
    this.sealed = true;
  };
}
