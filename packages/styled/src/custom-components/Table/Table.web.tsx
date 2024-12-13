import { type ComponentType, type ReactHTML, forwardRef } from 'react';
import type { ViewProps } from 'react-native';
// @ts-expect-error
import { unstable_createElement } from 'react-native-web';

function createView(tag: keyof ReactHTML): ComponentType<ViewProps> {
  const Element = forwardRef((props: ViewProps, ref) => {
    return unstable_createElement(tag, { ...props, ref });
  }) as ComponentType<ViewProps>;

  Element.displayName = tag.toLocaleUpperCase();
  return Element;
}

export const Table = createView('table');
Table.displayName = 'Table';

export const THead = createView('thead');
THead.displayName = 'THead';

export const TBody = createView('tbody');
TBody.displayName = 'TBody';

export const TFoot = createView('tfoot');
TFoot.displayName = 'TFoot';

export const TH = createView('th');
TH.displayName = 'TH';

export const TR = createView('tr');
TR.displayName = 'TR';

export const TD = createView('td');
TD.displayName = 'TD';

export const Caption = createView('caption');
Caption.displayName = 'Caption';
