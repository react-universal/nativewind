import { createVirtualSheet, Preflight, SheetEntry } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Option from 'effect/Option';
import micromatch from 'micromatch';
import path from 'node:path';
import type { TailwindConfig } from '@native-twin/core';
import { defineConfig, createTailwind } from '@native-twin/core';
import { CompilerContext, RuntimeComponentEntry } from '@native-twin/css/jsx';
import { TWIN_CSS_FILES } from '../../shared';
import { JSXMappedAttribute } from '../babel';
import { maybeLoadJS } from '../utils';
import type { InternalTwFn, InternalTwinConfig } from './twin.types';
import {
  createTwinCSSFiles,
  getElementEntries,
  getTwinCacheDir,
  getTwinConfigPath,
} from './twin.utils.node';

export class __NativeTwinManager {
  private readonly __tw: InternalTwFn;
  private readonly twWeb: InternalTwFn;
  private readonly nativeConfig: TailwindConfig<InternalTwinConfig>;
  private readonly webConfig: TailwindConfig<InternalTwinConfig>;
  debugEnabled = false;

  readonly preflight: Preflight;
  readonly platformOutputs: string[];
  readonly outputDir: string;
  readonly twinConfigPath: string;
  readonly projectRoot: string;
  readonly platform: string;
  readonly inputCSS: string;
  runtimeEntries: SheetEntry[];
  constructor(data: {
    twinConfigPath: string;
    projectRoot: string;
    platform: string;
    inputCSS: string;
    runtimeEntries: __NativeTwinManager['runtimeEntries'];
  }) {
    this.runtimeEntries = data.runtimeEntries;
    this.twinConfigPath = data.twinConfigPath;
    this.projectRoot = data.projectRoot;
    this.platform = data.platform;
    this.inputCSS = data.inputCSS;
    this.nativeConfig = this.getUserTwinConfig({
      platform: 'native',
      twinConfigPath: data.twinConfigPath,
    });
    this.webConfig = this.getUserTwinConfig({
      platform: 'web',
      twinConfigPath: data.twinConfigPath,
    });
    // this.config = this.getUserTwinConfig({ platform, twinConfigPath });
    this.__tw = createTailwind(this.config, createVirtualSheet());
    this.twWeb = createTailwind(this.webConfig, createVirtualSheet());
    this.preflight = this.webConfig.preflight;
    this.outputDir = getTwinCacheDir();
    this.platformOutputs = TWIN_CSS_FILES.map((x) => path.join(this.outputDir, x));
  }

  get sheetTarget() {
    return this.tw.target;
  }

  get tw() {
    if (this.platform === 'web') {
      return this.twWeb;
    }
    return this.__tw;
  }

  get config(): TailwindConfig<InternalTwinConfig> {
    if (this.platform === 'web') {
      return this.webConfig;
    }
    return this.nativeConfig;
  }

  get baseRem() {
    return this.config.root.rem ?? 16;
  }

  get context(): CompilerContext {
    return {
      baseRem: this.baseRem,
      platform: this.platform,
    };
  }

  get allowedPathsGlob() {
    return RA.map(this.config.content, (x) => path.join(this.projectRoot, x));
  }

  get allowedPaths() {
    return RA.map(
      RA.map(this.allowedPathsGlob, (x) => micromatch.scan(x)),
      (x) => x.base,
    );
  }

  getJSXElementEntries(runtimeData: JSXMappedAttribute[]): RuntimeComponentEntry[] {
    return getElementEntries(runtimeData, this.tw, this.context);
  }

  createCSSInput() {
    createTwinCSSFiles({
      outputDir: this.outputDir,
      inputCSS: this.inputCSS,
    });
  }

  isAllowedPath(filePath: string) {
    // console.log('ALLOWED_PATHS: ', filePath, this.allowedPathsGlob);
    return (
      micromatch.isMatch(path.join(this.projectRoot, filePath), this.allowedPathsGlob) ||
      micromatch.isMatch(filePath, this.allowedPathsGlob)
    );
  }

  getPlatformOutput(platform: string) {
    const output =
      this.platformOutputs.find((x) => x.includes(`${platform}.`)) ??
      require.resolve('@native-twin/core/build/.cache/twin.css.native.js');
    return output;
  }

  getPlatformInput() {
    return path.join(this.projectRoot, this.inputCSS);
  }

  getUserTwinConfig(params: {
    twinConfigPath: string;
    platform: TailwindConfig['mode'];
  }): TailwindConfig<InternalTwinConfig> {
    return getTwinConfigPath(this.projectRoot, params.twinConfigPath).pipe(
      Option.flatMap((x) => maybeLoadJS<TailwindConfig<InternalTwinConfig>>(x)),
      Option.map((x) => ({
        ...x,
        mode: params.platform,
        root: { rem: x.root.rem ?? 16 },
      })),
      Option.getOrElse(() =>
        defineConfig({
          content: [],
          mode: params.platform,
          root: { rem: 16 },
        }),
      ),
    );
  }
}
