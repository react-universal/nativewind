import { packages } from '@babel/standalone';

const impl = packages.template;

export const expression = impl.expression;
export const program = impl.program;
export const smart = impl.smart;
export const statement = impl.statement;
export const statements = impl.statements;

export default impl.default;
