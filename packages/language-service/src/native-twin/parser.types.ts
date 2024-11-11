import type {
  ArbitraryToken,
  ClassNameToken,
  SheetEntry,
  VariantClassToken,
  VariantToken,
} from '@native-twin/css';
import { TemplateTokenWithText } from '../models/twin/template-token.model';

export type LocatedParser<A extends object> = {
  start: number;
  end: number;
} & A;

export interface LocatedGroupToken {
  type: 'GROUP';
  start: number;
  end: number;
  value: {
    base: LocatedParser<ClassNameToken> | LocatedParser<VariantToken>;
    content: TemplateToken[];
  };
}

export type TemplateToken =
  | LocatedParser<LocatedGroupToken>
  | LocatedParser<VariantClassToken>
  | LocatedParser<VariantToken>
  | LocatedParser<ClassNameToken>
  | LocatedParser<ArbitraryToken>;

export interface LocatedSheetEntry extends SheetEntry {
  loc: {
    start: number;
    end: number;
  };
}

export interface LocatedSheetEntry extends SheetEntry {
  loc: {
    start: number;
    end: number;
  };
}

export interface LocatedGroupTokenWithText {
  type: 'GROUP';
  start: number;
  end: number;
  value: {
    base: TemplateTokenWithText;
    content: TemplateTokenWithText[];
  };
}
