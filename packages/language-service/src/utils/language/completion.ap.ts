import * as Equivalence from 'effect/Equivalence';
import * as Order from 'effect/Order';
import type * as vscode from 'vscode-languageserver';
import type {
  TwinRuleCompletion,
  TwinVariantCompletion,
} from '../../models/twin/native-twin.types.js';

export const orderCompletions = Order.mapInput(
  Order.number,
  (x: TwinRuleCompletion) => x.order,
);

export const diagnosticItemEquivalence = Equivalence.mapInput(
  Equivalence.string,
  (x: vscode.Diagnostic) => x.message,
);

export const orderVariantsCompletions = Order.mapInput(
  Order.number,
  (x: TwinVariantCompletion) => x.position,
);

export const eqTwinRuleWithCompletion = Equivalence.mapInput(
  (x: TwinRuleCompletion) => x.completion.className,
)(Equivalence.string);

export const eqTwinVariantWithCompletion = Equivalence.mapInput(
  (x: TwinVariantCompletion) => x.position,
)(Equivalence.number);

export const compareTwinRuleWithClassName =
  (twinRule: TwinRuleCompletion) => (data: string[]) => {
    const { completion } = twinRule;
    return data.some((x) => completion.className.startsWith(x));
  };
