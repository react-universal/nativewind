import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import ts from 'typescript';
import type { TemplateContext } from 'typescript-template-language-service-decorator';
import { relative } from 'typescript-template-language-service-decorator/lib/nodes';
import StandardScriptSourceHelper from 'typescript-template-language-service-decorator/lib/standard-script-source-helper';
import { TSPluginService } from '../plugin/TSPlugin.service';
import { getSourceMatchers, match } from '../utils/match';
import { TemplateSourceHelperService } from './template.context';
import { StandardTemplateContext, getValidTemplateNode } from './template.utils';

export const TemplateSourceHelperServiceLive = Layer.scoped(
  TemplateSourceHelperService,
  Effect.gen(function* ($) {
    const main = yield* $(TSPluginService);
    const sourceMatchers = getSourceMatchers(main.plugin.ts, main.plugin.config);
    const helper = new StandardScriptSourceHelper(
      main.plugin.ts,
      main.plugin.info.project,
    );

    return {
      helper,
      sourceMatchers,
      getRelativePosition(context, offset) {
        const baseLC = helper.getLineAndChar(
          context.fileName,
          context.node.getStart() + 1,
        );
        const cursorLC = helper.getLineAndChar(context.fileName, offset);
        return relative(baseLC, cursorLC);
      },
      getTemplateSettings() {
        return {
          get tags() {
            return main.plugin.config.tags;
          },
          enableForStringWithSubstitutions: true,
          getSubstitution(_, start, end) {
            return `\${${'x'.repeat(end - start - 3)}}`;
          },
        };
      },

      getTemplateSourceNode(fileName, position) {
        const node = helper.getNode(fileName, position);
        return Option.fromNullable(node).pipe(
          Option.flatMap((x) => {
            const validNode = getValidTemplateNode(x);
            if (!validNode) return Option.none();
            return Option.some(validNode);
          }),
          Option.flatMap((x) => {
            let currentNode: ts.Node = x;

            while (currentNode && !ts.isSourceFile(currentNode)) {
              if (match(currentNode, sourceMatchers)) {
                return Option.some(x);
              }

              if (ts.isCallLikeExpression(currentNode)) {
                return Option.none();
              }

              // TODO stop conditions
              currentNode = currentNode.parent;
            }
            return Option.none();
          }),
          Option.flatMap((x) => (position <= x.pos ? Option.none() : Option.some(x))),
        );
      },

      getTemplateContext(node, position) {
        return node.pipe(
          Option.flatMap((x) => {
            if (position <= x.pos) {
              return Option.none();
            }

            // Make sure we are not inside of a placeholder
            if (ts.isTemplateExpression(x)) {
              let start = x.head.end;
              for (const child of x.templateSpans.map((x) => x.literal)) {
                const nextStart = child.getStart();
                if (position >= start && position <= nextStart) {
                  return Option.none();
                }
                start = child.getEnd();
              }
            }

            const fileName = x.getSourceFile().fileName;

            return Option.some(
              new StandardTemplateContext(
                ts,
                fileName,
                x,
                helper,
                this.getTemplateSettings(),
              ) as TemplateContext,
            );
          }),
        );
      },
    };
  }),
);
