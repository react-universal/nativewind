import { cx, tw } from '@native-twin/core';
import type { JSXInternalProps } from '../types/jsx.types.js';
import type { ComponentConfig } from '../types/styled.types.js';

export function jsxStyles(props: JSXInternalProps | null | undefined, type: any) {
  const configs = type?.defaultProps?.['configs'] as ComponentConfig[];
  if (props?.['className']) {
    const className = props['className'];
    let twinClassName = cx(`${className}`);
    if (typeof className === 'string' && twinClassName === '') {
      twinClassName = className;
    }
    const classes = tw(`${className}`);
    // if (!classes) return;
    // if (classes.length === 0) return;

    if (!classes || (classes.length === 0 && className)) {
    } else {
      props['className'] = twinClassName;
      props['style'] = [
        {
          $$css: true,
          [twinClassName]: twinClassName,
        },
        props?.['style'] ?? '',
      ];
      if (props && configs) {
        for (const config of configs) {
          const source = props?.[config.source];
          // const sheet = props[`_${config.target}`];
          if (!source) continue;

          if (source) {
            tw(`${source}`);
            props[config.target] = cx`${source}`;
            // props[config.target] = finalSheet.getStyles({
            //   isParentActive: false,
            //   isPointerActive: false,
            // });
          }
        }
      }
    }
  }
}
