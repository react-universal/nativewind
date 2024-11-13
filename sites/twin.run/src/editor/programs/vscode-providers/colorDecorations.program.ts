import * as vscode from 'vscode';
import { Numberify, RGBA, TinyColor } from '@ctrl/tinycolor';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import {
  Constants,
  DocumentLanguageRegion,
  NativeTwinManagerService,
  TemplateTokenData,
  TwinRuleCompletion,
} from '@native-twin/language-service';
import { TwinTextDocument } from '@/editor/models/TwinTextDocument.model';

export const InstallColorDecorations = Effect.gen(function* () {});
