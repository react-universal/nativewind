import * as ReadonlyArray from 'effect/Array';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import type ts from 'typescript';
import type { TemplateContext } from 'typescript-template-language-service-decorator';
import { parseTemplate } from '../native-twin/nativeTwin.parser';
import type { TemplateSourceHelperServiceShape } from './template.context';
import type { LocatedGroupToken, TemplateTokenWithText } from './template.types';

interface TemplateNodeShape {
  readonly node:
    | ts.StringLiteral
    | ts.NoSubstitutionTemplateLiteral
    | ts.TemplateExpression;
  readonly cursorPosition: number;
  readonly templateContext: TemplateContext;
  readonly parsedTemplate: TemplateTokenWithText[];
  readonly positions: {
    relative: {
      position: ts.LineAndCharacter;
      offset: number;
    };
    document: {
      start: number;
      end: number;
    };
  };

  // getTokenAtPosition(offset: number): TemplateTokenWithText[];
}

export class TemplateNode extends Data.Class<TemplateNodeShape> {
  getTokenAtPosition(offset: number) {
    return pipe(
      ReadonlyArray.fromIterable(this.parsedTemplate),
      ReadonlyArray.filter((x) => offset >= x.start && offset <= x.end),
      ReadonlyArray.map((x) => {
        if (x.type === 'VARIANT') {
          return {
            ...x,
            type: 'GROUP',
            value: {
              base: x,
              content: [],
            },
            end: x.end,
            start: x.start,
          } satisfies LocatedGroupToken;
        }
        return x;
      }),
    );
  }
}

export const acquireTemplateNode = (
  filename: string,
  position: number,
  templateSvc: TemplateSourceHelperServiceShape,
) => {
  return Effect.sync(() => {
    const templateNode = templateSvc.getTemplateSourceNode(filename, position);

    const templateContext = templateSvc.getTemplateContext(templateNode, position);
    const parsedTemplate = Option.map(templateContext, (x) => parseTemplate(x.text));

    return Option.all([templateNode, templateContext, parsedTemplate]).pipe(
      Option.map(([node, context, parsed]) => {
        const templatePosition = templateSvc.getRelativePosition(context, position);
        const textOffset = context.toOffset(templatePosition);
        const documentPosition = {
          start: context.node.getStart(),
          end: context.node.getEnd(),
        };
        return new TemplateNode({
          node,
          cursorPosition: position,
          templateContext: context,
          parsedTemplate: parsed,
          positions: {
            relative: {
              position: templatePosition,
              offset: textOffset,
            },
            document: documentPosition,
          },
        });
      }),
    );
  });
};
