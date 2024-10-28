import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import type { CompilerInput } from '../babel.types';

export class BuildConfig extends Context.Tag('babel/compiler/config')<
  BuildConfig,
  CompilerInput
>() {}

export const makeBabelConfig = (input: CompilerInput) => Layer.succeed(BuildConfig, input);
