/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="WebWorker" />

/**
 * Worker to fetch typescript definitions for dependencies.
 * Credits to @CompuIves
 * https://github.com/CompuIves/codesandbox-client/blob/dcdb4169bcbe3e5aeaebae19ff1d45940c1af834/packages/app/src/app/components/CodeEditor/Monaco/workers/fetch-dependency-typings.js
 *
 */
import * as BrowserRunner from '@effect/platform-browser/BrowserWorkerRunner';
import * as Runner from '@effect/platform/WorkerRunner';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import sucrase from 'sucrase';
import { CompileCodeRequestSchema, CompiledCodeResponse } from './shared.schemas';

const jsxConst = 'const _jsxFileName = "";';
const trimCode = (code: string) => code.trim().replace(/;$/, '');
const spliceJsxConst = (code: string) => code.replace(jsxConst, '').trim();
const addJsxConst = (code: string) => jsxConst + code;
const wrapReturn = (code: string) => `return (${code})`;

const WorkerLive = Runner.layerSerialized(CompileCodeRequestSchema, {
  CompileCodeRequestSchema: (req) => {
    console.log('REQ: ', req);
    const code = addJsxConst(req.jsx);
    const transformed = sucrase.transform(code, { transforms: ['imports'] });
    const spliced = spliceJsxConst(transformed.code);
    const trimmed = trimCode(spliced);
    const tsTransform = sucrase.transform(trimmed, { transforms: ['jsx', 'typescript'] });
    const wrapped = wrapReturn(tsTransform.code);
    const compiled = trimCode(wrapped);

    return Stream.make(compiled).pipe(
      Stream.map((x) =>
        CompiledCodeResponse.make({
          css: '',
          js: x,
        }),
      ),
    );
  },
}).pipe(Layer.provide(BrowserRunner.layer));

Effect.runFork(Layer.launch(WorkerLive));
