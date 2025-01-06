export interface VariantToken {
  type: 'VARIANT';
  value: {
    /**
     * Has the util an important `!` symbol
     */
    i: boolean;
    /**
     * The variant name like `md` or `sm` if set, but without `!` and variants
     */
    n: string;
  }[];
}

export interface ColorModifierToken {
  type: 'COLOR_MODIFIER';
  /**
   * Color modifier `/10` or `/[0.5]`
   */
  value: string;
}
export interface ClassNameToken {
  type: 'CLASS_NAME';
  value: {
    /**
     * Has the util an important `!` symbol
     */
    i: boolean;
    /**
     * The utility name including `-` if set, but without `!` and variants
     */
    n: string;
    /**
     * Has the util a color modifier `bg-red-200/10` or `bg-red-200/[0.5]` symbol
     */
    m: ColorModifierToken | null;
  };
}
export interface VariantClassToken {
  type: 'VARIANT_CLASS';
  value: [VariantToken, ClassNameToken];
}
export interface ArbitraryToken {
  type: 'ARBITRARY';
  value: string;
}
export interface GroupToken {
  type: 'GROUP';
  value: {
    /**
     * The group root creator can be:
     * - className based like `bg()` or `text()`
     * - variant based like `md:()` or `sm:()`
     * * Any of them without `:` or `()`
     */
    base: ClassNameToken | VariantToken;
    /**
     * The group content which can be any valid token or another group nested
     * - className based like `bg(blue-200)` or `text(lg blue-200)`
     * - variant based like `md:(bg-blue-200)`
     * - nested like md:(bg-blue-200 sm:(bg-red-200))
     * * Any of them without the root token `md:()` or `text()`
     */
    content: (ClassNameToken | GroupToken | VariantClassToken | ArbitraryToken)[];
  };
}

/** @category `Tailwind Types` */
export interface TWParsedRule {
  /** The calculated precedence taking all variants into account. */
  readonly p: number;

  /**
   * The utility name including `-` if set, but without `!` and variants
   */
  readonly n: string;

  /**
   * All variants without trailing colon: `hover`, `focus:`
   */
  readonly v: string[];

  /**
   * Has the util an important `!` symbol
   */
  readonly i: boolean;

  /**
   * Has the util a color modifier `bg-red-200/10` or `bg-red-200/[0.5]` symbol
   */
  readonly m: ColorModifierToken | null;
}

export interface SegmentToken {
  type: 'segment';
  value: string;
}

export interface ArbitrarySegmentToken {
  type: 'arbitrary';
  value: string;
}

export interface RuleHandlerToken {
  base: string;
  suffixes: string[];
  segment: SegmentToken | ArbitrarySegmentToken;
  negative: boolean;
}

export type TWScreenValueConfig =
  | string
  | { raw: string }
  | { min: string; max?: string }
  | { min?: string; max: string };
