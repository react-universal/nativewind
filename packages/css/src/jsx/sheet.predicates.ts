import { OwnSheetSelectors } from '../css/css.constants';
import type { ValidChildPseudoSelector } from '../css/css.types';
import { getRuleSelectorGroup } from '../tailwind/tailwind.utils';
import type { SheetEntryHandler } from './SheetEntry';

interface ChildSelectorBrand {
  readonly ChildSelector: unique symbol;
}
type ChildSelector = ValidChildPseudoSelector & ChildSelectorBrand;

interface OwnSelectorBrand {
  readonly OwnSelector: unique symbol;
}
type OwnSelector = (typeof OwnSheetSelectors)[number] & OwnSelectorBrand;

const childTest = new RegExp(/^(&:)?(first|last|odd|even).*/g);
const pointerEntriesTest = new RegExp(/^(&:)?(hover|focus|active|group).*/g);
const groupEntriesTest = new RegExp(/^(&:)?(group-).*/g);

/** @category Predicates */
export const isChildEntry = (entry: SheetEntryHandler) =>
  isChildSelector(getRuleSelectorGroup(entry.selectors));

/** @category Predicates */
export const isPointerSelector = (group: string): group is ChildSelector => {
  return (
    group === 'hover' ||
    group === 'focus' ||
    group === 'active' ||
    pointerEntriesTest.exec(group) !== null
  );
};

/** @category Predicates */
export const isGroupSelector = (group: string): group is ChildSelector => {
  return (
    group === 'group' ||
    group === 'group-hover' ||
    group === 'group-active' ||
    group === 'group-focus' ||
    groupEntriesTest.exec(group) !== null
  );
};

/** @category Predicates */
export const isChildSelector = (group: string): group is ChildSelector => {
  return (
    group === 'first' ||
    group === 'last' ||
    group === 'even' ||
    group === 'odd' ||
    group.includes('first') ||
    group.includes('last') ||
    group.includes('even') ||
    group.includes('odd') ||
    childTest.exec(group) !== null
  );
};

/** @category Predicates */
export const isOwnSelector = (group: string): group is OwnSelector =>
  OwnSheetSelectors.includes(group as OwnSelector);

/** @category Predicates */
export const isPointerEntry = (entry: SheetEntryHandler) => {
  const group = getRuleSelectorGroup(entry.selectors);
  return group === 'group' || group === 'pointer';
};

/** @category Predicates */
export const isGroupEventEntry = (entry: SheetEntryHandler) =>
  getRuleSelectorGroup(entry.selectors) === 'group';

/** @category Predicates */
export const isGroupParent = (entry: SheetEntryHandler) =>
  entry.selectors.includes('group');
