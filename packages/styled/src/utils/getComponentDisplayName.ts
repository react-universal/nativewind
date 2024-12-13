import type { ComponentType, ElementType } from 'react';

export function getComponentDisplayName(
  primitive: ComponentType<any> | ElementType,
): string {
  if (typeof primitive === 'string') {
    return primitive;
  }
  return primitive.displayName ?? primitive.name ?? 'NoName';
}
