import { createVirtualSheet } from '@native-twin/css';
import * as Context from 'effect/Context';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import {
  createTailwind,
  createThemeContext,
  cx,
  defineConfig,
  setup,
  tx,
} from '@native-twin/core';
import { presetTailwind } from '@native-twin/preset-tailwind';
import { DEFAULT_TWIN_CONFIG } from '../utils/constants.utils';
import { requireJS } from '../utils/load-js';
import { createStyledContext } from '../utils/sheet.utils';
import {
  InternalTwFn,
  InternalTwinConfig,
  InternalTwinThemeContext,
  TwinStore,
  TwinRuleCompletion,
  TwinVariantCompletion,
} from './native-twin.types';
import { createTwinStore } from './utils/native-twin.utils';

export class NativeTwinManager {
  tw: InternalTwFn;
  context: InternalTwinThemeContext;
  userConfig: InternalTwinConfig = DEFAULT_TWIN_CONFIG;
  completions: TwinStore = {
    twinRules: HashSet.empty<TwinRuleCompletion>(),
    twinVariants: HashSet.empty<TwinVariantCompletion>(),
  };

  constructor() {
    this.tw = this.getNativeTwin();
    this.context = this.getContext();
  }

  get cx() {
    return cx;
  }

  get tx() {
    return tx;
  }

  loadUserFile(configFile: string) {
    this.userConfig = this.getUserConfig(configFile);
    this.tw = this.getNativeTwin();
    this.context = this.getContext();

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

  private getUserConfig(filePath: string) {
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

export class NativeTwinManagerService extends Context.Tag('NativeTwinManager')<
  NativeTwinManagerService,
  NativeTwinManager
>() {
  static Live = Layer.succeed(NativeTwinManagerService, new NativeTwinManager());
}
