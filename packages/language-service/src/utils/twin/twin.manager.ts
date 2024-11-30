import { createVirtualSheet } from '@native-twin/css';
import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Option from 'effect/Option';
import micromatch from 'micromatch';
import * as path from 'node:path';
import {
  createTailwind,
  createThemeContext,
  cx,
  defineConfig,
  setup,
  tx,
} from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';
import type {
  InternalTwFn,
  InternalTwinConfig,
  InternalTwinThemeContext,
  TwinStore,
  TwinRuleCompletion,
  TwinVariantCompletion,
} from '../../models/twin/native-twin.types.js';
import { DEFAULT_TWIN_CONFIG } from '../constants.utils.js';
import { requireJS } from '../load-js.js';
import { createStyledContext } from '../sheet.utils.js';
import { createTwinStore } from '../twin/native-twin.utils.js';

export class NativeTwinManager {
  tw: InternalTwFn;
  context: InternalTwinThemeContext;
  userConfig: InternalTwinConfig = DEFAULT_TWIN_CONFIG;
  completions: TwinStore = {
    twinRules: HashSet.empty<TwinRuleCompletion>(),
    twinVariants: HashSet.empty<TwinVariantCompletion>(),
  };
  private _configFile: string;

  constructor() {
    this._configFile = './tailwind.config.ts';
    this.tw = this.getNativeTwin();
    this.context = this.getContext();
  }

  get cx() {
    return cx;
  }

  get tx() {
    return tx;
  }

  get configFile() {
    return this._configFile;
  }

  get configFileRoot() {
    return path.dirname(this._configFile);
  }

  get allowedPathsGlob() {
    return RA.map(this.tw.config.content, (x) => path.join(this.configFileRoot, x));
  }

  get allowedPaths() {
    return RA.map(
      RA.map(this.allowedPathsGlob, (x) => micromatch.scan(x)),
      (x) => x.base,
    );
  }

  setupManualTwin() {
    this.userConfig = defineConfig({
      content: [''],
      presets: [presetTailwind()],
    });
    this.tw = this.getNativeTwin();
    this.context = this.getContext();

    this._configFile = 'tailwind.config.ts';
    this.completions = createTwinStore({
      config: this.userConfig,
      context: this.context,
      tw: this.tw,
    });
  }

  loadUserFile(configFile: string) {
    this.userConfig = this.getUserConfig(configFile);
    this.tw = this.getNativeTwin();
    this.context = this.getContext();

    this._configFile = configFile;
    this.completions = createTwinStore({
      config: this.userConfig,
      context: this.context,
      tw: this.tw,
    });
  }

  getCompilerContext() {
    return createStyledContext(this.userConfig.root.rem);
  }

  getTwinRules() {
    return this.completions.twinRules;
  }

  private getContext() {
    return createThemeContext(this.userConfig);
  }

  private getNativeTwin() {
    const sheet = createVirtualSheet();
    setup(this.userConfig, sheet);
    return createTailwind(this.userConfig, sheet);
  }

  isAllowedPath(filePath: string) {
    // console.log('ALLOWED_PATHS: ', filePath, this.allowedPathsGlob);
    return (
      micromatch.isMatch(
        path.join(this.configFileRoot, filePath),
        this.allowedPathsGlob,
      ) || micromatch.isMatch(filePath, this.allowedPathsGlob)
    );
  }

  private getUserConfig(filePath: string) {
    this._configFile = filePath;
    return pipe(
      Option.fromNullable(filePath),
      Option.flatMap(requireJS),
      Option.map(defineConfig),
      Option.getOrElse(() =>
        defineConfig({
          content: [''],
          presets: [presetTailwind()],
        }),
      ),
    );
  }
}
