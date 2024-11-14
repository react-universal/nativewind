import { packages } from '@babel/standalone';

export const parse = packages.parser.parse;
export const parseExpression = packages.parser.parseExpression;
export const tokTypes = packages.parser.tokTypes;
