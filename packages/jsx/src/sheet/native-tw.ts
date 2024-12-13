import { type RuntimeTW, type __Theme__, tw as tw$ } from '@native-twin/core';
import type { Sheet, SheetEntry } from '@native-twin/css';

export const tw = tw$ as RuntimeTW<__Theme__, Sheet<SheetEntry[]>>;
