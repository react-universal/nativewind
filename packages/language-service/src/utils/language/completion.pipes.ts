import * as ReadonlyArray from 'effect/Array';
import { pipe } from 'effect/Function';
import type { TwinRuleCompletion } from '../../models/twin/native-twin.types.js';
import type {
  TemplateTokenData,
  TemplateTokenWithText,
} from '../../models/twin/template-token.model.js';
import type { NativeTwinManagerService } from '../../services/NativeTwinManager.service.js';
import { getFlattenTemplateToken } from './language.utils.js';

export const getCompletionsForTokens = (
  tokens: TemplateTokenData[],
  twinService: NativeTwinManagerService['Type'],
) => {
  const resolvers = tokens.map(createCompletionTokenResolver);
  return pipe(
    twinService.completions.twinRules,
    ReadonlyArray.fromIterable,
    ReadonlyArray.filter((x) => resolvers.some((y) => y(x))),
  );
};

export const findExactTokenFromTemplateNode = (
  token: TemplateTokenWithText,
  cursorOffset: number,
) =>
  pipe(
    token,
    getFlattenTemplateToken,
    ReadonlyArray.findFirst(
      (y) => cursorOffset >= y.token.bodyLoc.start && cursorOffset <= y.token.bodyLoc.end,
    ),
  );

/** File Private */
const createCompletionTokenResolver =
  (node: TemplateTokenData) => (twinRule: TwinRuleCompletion) => {
    const tokenClassName = node.getTokenClassName();
    if (
      !tokenClassName.includes('/') &&
      twinRule.rule.themeSection === 'colors' &&
      twinRule.completion.className.includes('/')
    ) {
      return false;
    }
    return twinRule.completion.className.startsWith(tokenClassName);
  };
