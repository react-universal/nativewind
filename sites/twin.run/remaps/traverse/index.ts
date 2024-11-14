import { packages } from '@babel/standalone';

const impl = packages.traverse;

export const Binding = impl.Binding;
export const Hub = impl.Hub;
export const NodePath = impl.NodePath;
export const Scope = impl.Scope;
export const cache = impl.cache;
export const traverse = impl.default;
export const visitors = impl.visitors;
export const parseExpression = packages.parser.parseExpression;
export const tokTypes = packages.parser.tokTypes;

export default traverse;
