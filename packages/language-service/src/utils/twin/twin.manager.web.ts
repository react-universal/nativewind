import {
  createTailwind,
  createThemeContext,
  cx,
  defineConfig,
  setup,
  tx,
} from '@native-twin/core';
import { createVirtualSheet } from '@native-twin/css';
import { presetTailwind } from '@native-twin/preset-tailwind';
import * as RA from 'effect/Array';
import * as HashSet from 'effect/HashSet';
// @ts-expect-error sdasd
import picomatch from 'picomatch-browser';
import type {
  InternalTwFn,
  InternalTwinConfig,
  InternalTwinThemeContext,
  TwinRuleCompletion,
  TwinStore,
  TwinVariantCompletion,
} from '../../models/twin/native-twin.types.js';
import { DEFAULT_TWIN_CONFIG } from '../constants.utils.js';
import { createStyledContext } from '../sheet.utils.js';
import { createTwinStore } from './native-twin.utils.js';

export class MonacoNativeTwinManager {
  tw: InternalTwFn;
  context: InternalTwinThemeContext;
  userConfig: InternalTwinConfig = DEFAULT_TWIN_CONFIG;
  completions: TwinStore = {
    twinRules: HashSet.empty<TwinRuleCompletion>(),
    twinVariants: HashSet.empty<TwinVariantCompletion>(),
  };
  private _configFile;

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
    return this._configFile;
  }

  get allowedPathsGlob() {
    return this.tw.config.content;
  }

  get allowedPaths(): string[] {
    return RA.map(
      RA.map(this.allowedPathsGlob, (x) => picomatch.scan(x)),
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
      picomatch.isMatch(filePath, this.allowedPathsGlob) ||
      picomatch.isMatch(filePath, this.allowedPathsGlob)
    );
  }

  private getUserConfig(filePath: string) {
    this._configFile = filePath;
    return defineConfig({
      content: [''],
      presets: [presetTailwind()],
    });
  }
}
