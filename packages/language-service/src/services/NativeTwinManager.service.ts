import type { ThemeContext, TxFunction, __Theme__, cx } from '@native-twin/core';
import type { TailwindPresetTheme } from '@native-twin/preset-tailwind';
import * as Context from 'effect/Context';
import type * as HashSet from 'effect/HashSet';
import type {
  InternalTwFn,
  InternalTwinConfig,
  InternalTwinThemeContext,
  TwinRuleCompletion,
  TwinStore,
} from '../models/twin/native-twin.types.js';
import type { StyledContext } from '../utils/sheet.utils.js';

export class NativeTwinManagerService extends Context.Tag('NativeTwinManager')<
  NativeTwinManagerService,
  {
    tw: InternalTwFn;
    context: InternalTwinThemeContext;
    userConfig: InternalTwinConfig;
    completions: TwinStore;
    _configFile: string;
    configFileRoot: string;
    allowedPaths: string[];
    tx: TxFunction;
    cx: typeof cx;

    getContext(): ThemeContext<__Theme__ & TailwindPresetTheme>;
    getNativeTwin(): InternalTwFn;
    isAllowedPath(filepath: string): boolean;
    setupManualTwin(): void;
    loadUserFile(configFile: string): void;
    getCompilerContext(): StyledContext;
    getTwinRules(): HashSet.HashSet<TwinRuleCompletion>;
  }
>() {}
