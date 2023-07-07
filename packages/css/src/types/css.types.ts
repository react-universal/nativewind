export type SelectorGroup = 'base' | 'group' | 'pointer' | 'first' | 'last' | 'odd' | 'even';

type CSSUnits =
  | 'em'
  | 'rem'
  | 'px'
  | 'cn'
  | 'vh'
  | 'pc'
  | 'vw'
  | 'deg'
  | 'ex'
  | 'in'
  | '%'
  | 'turn'
  | 'rad';

export type CSSLengthUnit = {
  [U in CSSUnits]: {
    value: number;
    units: U;
  };
}[CSSUnits];

type CSSPointerEventKind = 'hover' | 'active' | 'focus';

export type CSSPointerEvent = {
  [U in CSSPointerEventKind]: {
    value: number;
    unit: U;
  };
}[CSSPointerEventKind];