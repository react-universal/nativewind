"use strict";
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../css/build/esm/tailwind/tailwind.constants.js
var globalKeywords = [
  "inherit",
  "initial",
  "revert",
  "revert-layer",
  "unset"
];

// ../helpers/build/esm/identity.utils.js
function asArray(value = []) {
  if (value == null)
    return [];
  return Array.isArray(value) ? value : [value];
}
__name(asArray, "asArray");

// ../helpers/build/esm/color.utils.js
function toColorValue(color, options = {
  opacityValue: "1"
}) {
  if (color[0] == "#" && (color.length == 4 || color.length == 7)) {
    color = color.replace("#", "");
    const r = parseInt(color.length == 3 ? color.slice(0, 1).repeat(2) : color.slice(0, 2), 16);
    const g = parseInt(color.length == 3 ? color.slice(1, 2).repeat(2) : color.slice(2, 4), 16);
    const b = parseInt(color.length == 3 ? color.slice(2, 3).repeat(2) : color.slice(4, 6), 16);
    return `rgba(${[r, g, b, options.opacityValue]})`;
  }
  if (options.opacityValue == "1")
    return color;
  if (options.opacityValue == "0")
    return "#0000";
  return color.replace(/^(rgb|hsl)(\([^)]+)\)$/, `$1a$2,${options.opacityValue})`);
}
__name(toColorValue, "toColorValue");

// ../helpers/build/esm/create-value.utils.js
function createExponentialUnits(stop, unit, start = 0) {
  const result = {};
  for (; start <= stop; start = start * 2 || 1) {
    result[start] = start + unit;
  }
  return result;
}
__name(createExponentialUnits, "createExponentialUnits");
function createLinearUnits(stop, unit = "", divideBy = 1, start = 0, step = 1, result = {}) {
  for (; start <= stop; start += step) {
    result[start] = start / divideBy + unit;
  }
  return result;
}
__name(createLinearUnits, "createLinearUnits");
function createPercentRatios(start, end) {
  const result = {};
  do {
    for (let dividend = 1; dividend < start; dividend++) {
      result[`${dividend}/${start}`] = Number((dividend / start * 100).toFixed(6)) + "%";
    }
  } while (++start <= end);
  return result;
}
__name(createPercentRatios, "createPercentRatios");

// ../css/build/esm/transforms/rule-to-css.js
function parsedRuleToClassName(rule) {
  let modifier = "";
  if (rule.m) {
    modifier = `/${rule.m.value}`;
  }
  return `${[...rule.v, (rule.i ? "!" : "") + rule.n + modifier].join(":")}`;
}
__name(parsedRuleToClassName, "parsedRuleToClassName");

// ../css/build/esm/transforms/interleave.js
function normalize(value) {
  if (value.includes("url(")) {
    return value.replace(/(.*?)(url\(.*?\))(.*?)/g, (_, before = "", url, after = "") => normalize(before) + url + normalize(after));
  }
  return value.replace(/(^|[^\\])_+/g, (fullMatch, characterBefore) => characterBefore + " ".repeat(fullMatch.length - characterBefore.length)).replace(/\\_/g, "_").replace(/(calc|min|max|clamp)\(.+\)/g, (match) => match.replace(/(-?\d*\.?\d(?!\b-.+[,)](?![^+\-/*])\D)(?:%|[a-z]+)?|\))([+\-/*])/g, "$1 $2 "));
}
__name(normalize, "normalize");

// ../native-twin/build/esm/config/defaults/variants.js
var defaultVariants = [
  ["focus-within", "&:focus-within"],
  ["hover", "&:hover"],
  ["focus", "&:focus"],
  ["(ios|android|web)", ({ 1: $1 }) => `&:${$1}`],
  ["focus-visible", "&:focus-visible"],
  [
    "((group|peer)(~[^-[]+)?)(-\\[(.+)]|[-[].+?)(\\/.+)?",
    ({ 2: type, 3: name = "", 4: $4, 5: $5 = "", 6: label = name }, { v }) => {
      const selector = normalize($5) || ($4[0] == "[" ? $4 : v($4.slice(1)));
      return `${(selector.includes("&") ? selector : "&" + selector).replace(/&/g, `.${type + label}`)}${type[0] == "p" ? "~" : " "}&`;
    }
  ],
  ["active", "&:active"],
  ["enabled", "&:enabled"],
  ["disabled", "&:disabled"],
  ["(first-(letter|line)|placeholder|backdrop|before|after)", ({ 1: $1 }) => `&::${$1}`]
];

// ../native-twin/build/esm/config/define-config.js
function defineConfig({ presets = [], ...userConfig }) {
  let config = {
    content: userConfig.content,
    darkMode: void 0,
    mode: userConfig.mode ?? "native",
    preflight: userConfig.preflight !== false && [],
    ignorelist: asArray(userConfig.ignorelist),
    rules: asArray(userConfig.rules),
    variants: asArray(userConfig.variants).concat(defaultVariants),
    root: {
      rem: userConfig.root?.rem ?? 16,
      ...userConfig.root
    },
    theme: {},
    animations: userConfig.animations ?? []
  };
  for (const preset of asArray([
    ...presets,
    {
      presets: [],
      mode: userConfig.mode,
      darkMode: userConfig.darkMode,
      preflight: userConfig.preflight !== false && asArray(userConfig.preflight),
      theme: userConfig.theme,
      root: userConfig.root
    }
  ])) {
    const { ignorelist, preflight: preflight2, rules, theme: theme2, variants, darkMode, animations } = typeof preset == "function" ? preset(config) : preset;
    config = {
      animations: [...asArray(config.animations), ...asArray(animations)],
      content: userConfig.content,
      preflight: config.preflight !== false && preflight2 !== false && [...asArray(config.preflight), ...asArray(preflight2)],
      root: config.root,
      mode: config.mode,
      darkMode,
      theme: {
        ...config.theme,
        ...theme2,
        extend: {
          ...config.theme.extend,
          ...theme2?.extend
        }
      },
      variants: [...config.variants, ...asArray(variants)],
      rules: [...config.rules, ...asArray(rules)],
      ignorelist: [...config.ignorelist, ...asArray(ignorelist)]
    };
  }
  return config;
}
__name(defineConfig, "defineConfig");

// ../native-twin/build/esm/theme/theme.match.js
function matchCssObject(pattern, resolver, meta = {
  canBeNegative: false,
  feature: "default",
  prefix: "",
  suffix: "",
  styleProperty: void 0,
  support: []
}) {
  return [pattern, null, resolver, meta];
}
__name(matchCssObject, "matchCssObject");
function matchThemeColor(pattern, property, meta = {
  feature: "default",
  styleProperty: property,
  canBeNegative: false,
  prefix: "",
  suffix: "",
  support: []
}) {
  return [
    pattern,
    "colors",
    (match, context, rule) => {
      let color;
      const className = parsedRuleToClassName(rule);
      const declarations = [];
      if (match.segment.type == "arbitrary") {
        color = match.segment.value;
      }
      if (!color) {
        color = context.colors[match.segment.value] ?? context.theme("colors", match.segment.value);
      }
      if (color) {
        const opacity2 = context.theme("opacity", rule.m?.value ?? "100");
        color = toColorValue(color, {
          opacityValue: opacity2 ?? "1"
        });
        if (meta.feature == "edges") {
          for (const key of getPropertiesForEdges({
            prefix: meta.prefix ?? property,
            suffix: meta.suffix ?? ""
          }, match.suffixes)) {
            declarations.push({
              prop: key,
              value: color
            });
          }
        } else {
          declarations.push({ prop: property, value: color });
        }
        return {
          className,
          declarations,
          selectors: [],
          precedence: 0,
          important: rule.i,
          animations: [],
          preflight: false
        };
      }
    },
    meta
  ];
}
__name(matchThemeColor, "matchThemeColor");
function matchAnimation(pattern) {
  return [
    pattern,
    null,
    (_match, ctx, parsed) => {
      const animation = ctx.animations.find((x) => x[0] === parsed.n);
      return {
        className: animation?.[0] ?? "NONCE",
        declarations: [],
        animations: asArray(animation?.[1]),
        important: parsed.i,
        precedence: parsed.p,
        selectors: parsed.v,
        preflight: false
      };
    }
  ];
}
__name(matchAnimation, "matchAnimation");
function matchThemeValue(pattern, themeSection, property, meta = {
  canBeNegative: false,
  feature: "default",
  prefix: "",
  suffix: "",
  styleProperty: property,
  support: []
}) {
  return [
    pattern,
    themeSection,
    (match, context, parsedRule) => {
      let value = null;
      let segmentValue = match.segment.value;
      const declarations = [];
      if (parsedRule.m) {
        segmentValue += `/${parsedRule.m.value}`;
      }
      if (match.segment.type == "arbitrary") {
        value = segmentValue;
      } else {
        value = context.theme(themeSection, segmentValue) ?? null;
      }
      if (!value)
        return;
      const properties = getProperties();
      for (const current of properties) {
        declarations.push({
          prop: current,
          value: maybeNegative(match.negative, value)
        });
      }
      if (property == "transform") {
        const entries = [...declarations];
        declarations.length = 0;
        declarations.push({
          prop: "transform",
          value: entries
        });
      }
      return {
        className: parsedRuleToClassName(parsedRule),
        declarations,
        selectors: [],
        precedence: 0,
        important: parsedRule.i,
        animations: [],
        preflight: false
      };
      function getProperties() {
        if (meta.feature == "edges") {
          return getPropertiesForEdges({
            prefix: meta.prefix ?? property,
            suffix: meta.suffix ?? ""
          }, match.suffixes);
        }
        if (meta.feature == "transform-2d") {
          return getPropertiesForTransform2d(meta.prefix ?? property, match.suffixes);
        }
        if (meta.feature == "corners") {
          return getPropertiesForCorners({
            prefix: meta.prefix ?? property,
            suffix: meta.suffix ?? ""
          }, match.suffixes);
        }
        if (meta.feature == "gap") {
          return getPropertiesForGap({
            prefix: meta.suffix ?? "",
            suffix: property ?? ""
          }, match.suffixes);
        }
        return asArray(property);
      }
      __name(getProperties, "getProperties");
    },
    meta
  ];
}
__name(matchThemeValue, "matchThemeValue");
function getPropertiesForEdges(property, edges) {
  if (edges.length == 0)
    return [`${property.prefix}${property.suffix}`];
  return edges.map((x) => {
    return `${property.prefix}${x}${property.suffix}`;
  });
}
__name(getPropertiesForEdges, "getPropertiesForEdges");
function getPropertiesForTransform2d(property, sides) {
  if (sides.length == 0)
    return [`${property}`];
  return sides.map((x) => {
    return `${property}${x}`;
  });
}
__name(getPropertiesForTransform2d, "getPropertiesForTransform2d");
function getPropertiesForGap(property, edges) {
  if (edges.length == 0)
    return [`${property.prefix}${property.suffix}`];
  return edges.map((x) => {
    return `${property.prefix}${x}${property.suffix.replace(/^[a-z]/, (k) => k[0]?.toUpperCase() ?? "")}`;
  });
}
__name(getPropertiesForGap, "getPropertiesForGap");
function getPropertiesForCorners(property, corners) {
  if (corners.length == 0)
    return [`${property.prefix}${property.suffix}`];
  return corners.map((x) => {
    return `${property.prefix}${x}${property.suffix}`;
  });
}
__name(getPropertiesForCorners, "getPropertiesForCorners");
function maybeNegative(isNegative, value) {
  if (isNegative && (!`${value}`.startsWith("0") || `${value}`.startsWith("0."))) {
    return `-${value}`;
  }
  return value;
}
__name(maybeNegative, "maybeNegative");

// ../preset-tailwind/build/esm/constants.js
var DEFAULT_META = {
  canBeNegative: false,
  feature: "default",
  prefix: "",
  styleProperty: void 0,
  suffix: "",
  support: []
};

// ../preset-tailwind/build/esm/tailwind-rules/transform.js
var translateRules = [
  matchThemeValue("translate-", "translate", "transform", {
    ...DEFAULT_META,
    feature: "transform-2d",
    prefix: "translate"
  }),
  matchThemeValue("rotate-", "rotate", "transform", {
    ...DEFAULT_META,
    feature: "transform-2d",
    prefix: "rotate"
  }),
  matchThemeValue("skew-", "skew", "transform", {
    ...DEFAULT_META,
    feature: "transform-2d",
    prefix: "skew"
  }),
  matchThemeValue("scale-", "scale", "transform", {
    ...DEFAULT_META,
    feature: "transform-2d",
    prefix: "scale"
  })
];

// ../preset-tailwind/build/esm/tailwind-rules/shadows.js
var boxShadowRules = [
  matchThemeValue("shadow-", "boxShadow", "shadowRadius")
];

// ../preset-tailwind/build/esm/tailwind-rules/align.js
var verticalAlignsRules = [
  matchThemeValue("align-", "verticalAlign", "verticalAlign", {
    canBeNegative: false,
    feature: "default",
    prefix: "",
    styleProperty: "verticalAlign",
    suffix: "",
    support: []
  })
];
var textAlignsRules = [
  matchThemeValue("text-", "textAlign", "textAlign")
];

// ../preset-tailwind/build/esm/tailwind-rules/background.js
var backgroundRules = [
  matchThemeColor("bg-", "backgroundColor")
];

// ../preset-tailwind/build/esm/tailwind-rules/behaviors.js
var outlineRules = [
  // matchThemeValue('outline-width-', 'lineWidth', 'outlineWidth'),
  // matchThemeColor('outline-', 'outlineColor'),
  // matchThemeValue('outline-offset-', 'lineWidth', 'outlineOffset'),
  // matchThemeValue('outline-', '', 'outlineStyle', {
  //   customValues: Object.fromEntries(outlineStyles),
  // }),
  matchCssObject("outline-none", (match, ctx, rule) => {
    if (ctx.mode == "native") {
      return null;
    }
    return {
      className: parsedRuleToClassName(rule),
      declarations: [
        {
          prop: "outline",
          value: "2px solid transparent"
        },
        {
          prop: "outlineOffset",
          value: "2px"
        }
      ],
      selectors: [],
      animations: [],
      conditions: rule.v,
      important: rule.i,
      precedence: rule.p,
      preflight: false
    };
  })
];
var appearanceRules = [
  matchCssObject("appearance-none", (match, ctx, rule) => ({
    className: parsedRuleToClassName(rule),
    declarations: [
      {
        prop: "appearance",
        value: "none"
      }
    ],
    conditions: rule.v,
    selectors: [],
    important: rule.i,
    precedence: rule.p,
    animations: [],
    preflight: false
  }))
];

// ../preset-tailwind/build/esm/tailwind-rules/border.js
var borderRules = [
  matchThemeColor("border-", "borderColor", {
    ...DEFAULT_META,
    feature: "edges",
    prefix: "border",
    suffix: "Color"
  }),
  matchThemeValue("border-", "borderStyle", "borderStyle"),
  matchThemeValue("border-", "borderWidth", "borderWidth", {
    ...DEFAULT_META,
    feature: "edges",
    prefix: "border",
    suffix: "Width"
  }),
  matchThemeValue("rounded-", "borderRadius", "borderRadius", {
    ...DEFAULT_META,
    feature: "corners",
    prefix: "border",
    suffix: "Radius"
  })
];

// ../preset-tailwind/build/esm/tailwind-rules/flex.js
var flexRules = [
  matchCssObject("flex", (match, ctx, rule) => ({
    className: parsedRuleToClassName(rule),
    declarations: [
      {
        prop: "display",
        value: "flex"
      }
    ],
    conditions: rule.v,
    important: rule.i,
    precedence: rule.p,
    selectors: [],
    animations: [],
    preflight: false
  })),
  matchThemeValue("flex-", "flex", "flex"),
  matchThemeValue("flex-", "flexDirection", "flexDirection"),
  matchThemeValue("flex-", "flexWrap", "flexWrap"),
  matchThemeValue("basis-", "flexBasis", "flexBasis"),
  matchThemeValue("grow-", "flexGrow", "flexGrow"),
  matchThemeValue("justify-", "justifyContent", "justifyContent"),
  matchThemeValue("items-", "alignItems", "alignItems"),
  matchThemeValue("self-", "alignItems", "alignSelf"),
  matchThemeValue("content-", "alignContent", "alignContent")
];

// ../preset-tailwind/build/esm/tailwind-rules/layout.js
var layoutThemeRules = [
  matchCssObject("hidden", (match, ctx, rule) => ({
    className: parsedRuleToClassName(rule),
    declarations: [
      {
        prop: "display",
        value: "none"
      }
    ],
    conditions: rule.v,
    important: rule.i,
    precedence: rule.p,
    selectors: [],
    animations: [],
    preflight: false
  })),
  matchThemeValue("overflow-", "overflow", "overflow"),
  matchThemeValue("object-", "objectFit", "objectFit")
];

// ../preset-tailwind/build/esm/tailwind-rules/opacity.js
var opacityRules = [
  matchThemeValue("opacity-", "opacity", "opacity")
];

// ../preset-tailwind/build/esm/tailwind-rules/position.js
var positionRules = [
  matchThemeValue("top-", "spacing", "top", {
    ...DEFAULT_META,
    canBeNegative: true
  }),
  matchThemeValue("left-", "spacing", "left", {
    ...DEFAULT_META,
    canBeNegative: true
  }),
  matchThemeValue("bottom-", "spacing", "bottom", {
    ...DEFAULT_META,
    canBeNegative: true
  }),
  matchThemeValue("right-", "spacing", "right", {
    ...DEFAULT_META,
    canBeNegative: true
  }),
  matchThemeValue("absolute", "position", "position"),
  matchThemeValue("relative", "position", "position"),
  matchThemeValue("z-", "zIndex", "zIndex", {
    ...DEFAULT_META,
    canBeNegative: true
  })
];

// ../preset-tailwind/build/esm/tailwind-rules/size.js
var sizeRules = [
  matchThemeValue("aspect-", "aspectRatio", "aspectRatio"),
  matchThemeValue("w-", "width", "width"),
  matchThemeValue("h-", "height", "height"),
  matchThemeValue("max-w-", "maxWidth", "maxWidth"),
  matchThemeValue("max-h-", "maxHeight", "maxHeight"),
  matchThemeValue("min-w-", "minWidth", "minWidth"),
  matchThemeValue("min-h-", "minHeight", "minHeight"),
  matchThemeValue("resize-", "resizeMode", "resizeMode")
];

// ../preset-tailwind/build/esm/tailwind-rules/spacing.js
var spacingRules = [
  matchThemeValue("p", "spacing", "padding", {
    ...DEFAULT_META,
    canBeNegative: true,
    feature: "edges",
    prefix: "padding"
  }),
  matchThemeValue("m", "spacing", "margin", {
    ...DEFAULT_META,
    canBeNegative: true,
    feature: "edges",
    prefix: "margin"
  }),
  matchThemeValue("gap-", "spacing", "gap", {
    ...DEFAULT_META,
    feature: "gap",
    prefix: "gap"
  })
];

// ../preset-tailwind/build/esm/tailwind-rules/transition.js
var transitionRules = [
  matchThemeValue("transition-", "transition", "transition", {
    ...DEFAULT_META,
    support: ["web"]
  })
];
var durationRules = [
  matchThemeValue("duration-", "duration", "transitionDuration", {
    ...DEFAULT_META
  })
];

// ../preset-tailwind/build/esm/tailwind-rules/typography.js
var fontThemeRules = [
  matchThemeValue("text-", "fontSize", "fontSize"),
  matchThemeColor("text-", "color"),
  matchThemeValue("font-", "fontWeight", "fontWeight"),
  matchThemeValue("font-", "fontFamily", "fontFamily"),
  matchThemeValue("leading-", "lineHeight", "lineHeight"),
  matchThemeColor("decoration-", "textDecorationColor"),
  matchThemeValue("decoration-", "textDecorationStyle", "textDecorationStyle"),
  matchThemeValue("decoration-", "textDecorationLine", "textDecorationLine"),
  matchThemeValue("capitalize", "textTransform", "textTransform"),
  matchThemeValue("uppercase", "textTransform", "textTransform"),
  matchThemeValue("lowercase", "textTransform", "textTransform"),
  matchThemeValue("normal", "fontStyle", "fontStyle"),
  matchThemeValue("italic", "fontStyle", "fontStyle")
];

// ../preset-tailwind/build/esm/tailwind-rules/default.js
var themeRules = [
  backgroundRules,
  flexRules,
  spacingRules,
  sizeRules,
  fontThemeRules,
  positionRules,
  textAlignsRules,
  borderRules,
  layoutThemeRules,
  opacityRules,
  outlineRules,
  verticalAlignsRules,
  appearanceRules,
  boxShadowRules,
  transitionRules,
  durationRules,
  translateRules
].flat(1);

// ../preset-tailwind/build/esm/tailwind-theme/index.js
var tailwind_theme_exports = {};
__export(tailwind_theme_exports, {
  alignContent: () => alignContent,
  alignItems: () => alignItems,
  aspectRatio: () => aspectRatio,
  backfaceVisibility: () => backfaceVisibility,
  baseSize: () => baseSize,
  blur: () => blur,
  borderRadius: () => borderRadius,
  borderStyle: () => borderStyle,
  borderWidth: () => borderWidth,
  boxShadow: () => boxShadow,
  colors: () => colors,
  containers: () => containers,
  dropShadow: () => dropShadow,
  duration: () => duration,
  easing: () => easing,
  flex: () => flex,
  flexBasis: () => flexBasis,
  flexDirection: () => flexDirection,
  flexGrow: () => flexGrow,
  flexWrap: () => flexWrap,
  fontFamily: () => fontFamily,
  fontSize: () => fontSize,
  fontStyle: () => fontStyle,
  fontWeight: () => fontWeight,
  height: () => height,
  justifyContent: () => justifyContent,
  letterSpacing: () => letterSpacing,
  lineHeight: () => lineHeight,
  lineWidth: () => lineWidth,
  maxHeight: () => maxHeight,
  maxWidth: () => maxWidth,
  objectFit: () => objectFit,
  opacity: () => opacity,
  overflow: () => overflow,
  position: () => position,
  preflight: () => preflight,
  resizeMode: () => resizeMode,
  ringWidth: () => ringWidth,
  rotate: () => rotate,
  scale: () => scale,
  screens: () => screens,
  skew: () => skew,
  spacing: () => spacing,
  textAlign: () => textAlign,
  textDecorationLine: () => textDecorationLine,
  textDecorationStyle: () => textDecorationStyle,
  textIndent: () => textIndent,
  textShadow: () => textShadow,
  textStrokeWidth: () => textStrokeWidth,
  textTransform: () => textTransform,
  theme: () => theme,
  translate: () => translate,
  verticalAlign: () => verticalAlign,
  verticalBreakpoints: () => verticalBreakpoints,
  width: () => width,
  wordSpacing: () => wordSpacing,
  zIndex: () => zIndex
});

// ../preset-tailwind/build/esm/tailwind-theme/colors.js
var colors = {
  inherit: "inherit",
  current: "currentColor",
  transparent: "transparent",
  black: "#000",
  white: "#fff",
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519"
  },
  pink: {
    50: "#fdf2f8",
    100: "#fce7f3",
    200: "#fbcfe8",
    300: "#f9a8d4",
    400: "#f472b6",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
    800: "#9d174d",
    900: "#831843",
    950: "#500724"
  },
  fuchsia: {
    50: "#fdf4ff",
    100: "#fae8ff",
    200: "#f5d0fe",
    300: "#f0abfc",
    400: "#e879f9",
    500: "#d946ef",
    600: "#c026d3",
    700: "#a21caf",
    800: "#86198f",
    900: "#701a75",
    950: "#4a044e"
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
    950: "#3b0764"
  },
  violet: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065"
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b"
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554"
  },
  sky: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49"
  },
  cyan: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4",
    600: "#0891b2",
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344"
  },
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e"
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
    950: "#022c22"
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16"
  },
  lime: {
    50: "#f7fee7",
    100: "#ecfccb",
    200: "#d9f99d",
    300: "#bef264",
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    800: "#3f6212",
    900: "#365314",
    950: "#1a2e05"
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#facc15",
    500: "#eab308",
    600: "#ca8a04",
    700: "#a16207",
    800: "#854d0e",
    900: "#713f12",
    950: "#422006"
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03"
  },
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
    950: "#431407"
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a"
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712"
  },
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617"
  },
  zinc: {
    50: "#fafafa",
    100: "#f4f4f5",
    200: "#e4e4e7",
    300: "#d4d4d8",
    400: "#a1a1aa",
    500: "#71717a",
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#09090b"
  },
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a"
  },
  stone: {
    50: "#fafaf9",
    100: "#f5f5f4",
    200: "#e7e5e4",
    300: "#d6d3d1",
    400: "#a8a29e",
    500: "#78716c",
    600: "#57534e",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
    950: "#0c0a09"
  },
  light: {
    50: "#fdfdfd",
    100: "#fcfcfc",
    200: "#fafafa",
    300: "#f8f9fa",
    400: "#f6f6f6",
    500: "#f2f2f2",
    600: "#f1f3f5",
    700: "#e9ecef",
    800: "#dee2e6",
    900: "#dde1e3",
    950: "#d8dcdf"
  },
  dark: {
    50: "#4a4a4a",
    100: "#3c3c3c",
    200: "#323232",
    300: "#2d2d2d",
    400: "#222222",
    500: "#1f1f1f",
    600: "#1c1c1e",
    700: "#1b1b1b",
    800: "#181818",
    900: "#0f0f0f",
    950: "#080808"
  },
  get lightBlue() {
    return this["sky"];
  },
  get warmGray() {
    return this["stone"];
  },
  get trueGray() {
    return this["neutral"];
  },
  get coolGray() {
    return this["gray"];
  },
  get blueGray() {
    return this["slate"];
  }
};
Object.values(colors).forEach((color) => {
  if (typeof color !== "string" && color !== void 0) {
    color.DEFAULT = color.DEFAULT || color[400];
  }
});

// ../preset-tailwind/build/esm/tailwind-theme/aligns.js
var verticalAlign = {
  mid: "middle",
  base: "baseline",
  btm: "bottom",
  baseline: "baseline",
  top: "top",
  start: "top",
  middle: "middle",
  bottom: "bottom",
  end: "bottom",
  "text-top": "text-top",
  "text-bottom": "text-bottom",
  sub: "sub",
  super: "super",
  ...Object.fromEntries(globalKeywords.map((x) => [x, x]))
};
var textAlign = {
  center: "center",
  left: "left",
  right: "right",
  justify: "justify",
  start: "start",
  end: "end"
};

// ../preset-tailwind/build/esm/tailwind-theme/filters.js
var blur = {
  DEFAULT: "8px",
  "0": "0",
  sm: "4px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "40px",
  "3xl": "64px"
};
var dropShadow = {
  DEFAULT: ["0 1px 2px rgba(0,0,0,0.1)", "0 1px 1px rgba(0,0,0,0.06)"],
  sm: "0 1px 1px rgba(0,0,0,0.05)",
  md: ["0 4px 3px rgba(0,0,0,0.07)", "0 2px 2px rgba(0,0,0,0.06)"],
  lg: ["0 10px 8px rgba(0,0,0,0.04)", "0 4px 3px rgba(0,0,0,0.1)"],
  xl: ["0 20px 13px rgba(0,0,0,0.03)", "0 8px 5px rgba(0,0,0,0.08)"],
  "2xl": "0 25px 25px rgba(0,0,0,0.15)",
  none: "0 0 rgba(0,0,0,0)"
};

// ../preset-tailwind/build/esm/tailwind-theme/mixed.js
var screens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};
var opacity = {
  .../* @__PURE__ */ createLinearUnits(100, "", 100, 0, 10),
  5: "0.05",
  25: "0.25",
  75: "0.75",
  95: "0.95"
};
var verticalBreakpoints = {
  ...screens
};
var lineWidth = {
  DEFAULT: "1px",
  none: "0",
  .../* @__PURE__ */ createLinearUnits(10, "rem", 4, 3)
};
var spacing = {
  DEFAULT: "1rem",
  none: "0",
  xs: "0.75rem",
  sm: "0.875rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "7xl": "4.5rem",
  "8xl": "6rem",
  "9xl": "8rem",
  // CUSTOM
  px: "1px",
  0: "0px",
  .../* @__PURE__ */ createLinearUnits(4, "rem", 4, 0.5, 0.5),
  .../* @__PURE__ */ createLinearUnits(12, "rem", 4, 5),
  14: "3.5rem",
  .../* @__PURE__ */ createLinearUnits(64, "rem", 4, 16, 4),
  72: "18rem",
  80: "20rem",
  96: "24rem"
};
var duration = {
  DEFAULT: "150ms",
  none: "0s",
  75: "75ms",
  100: "100ms",
  150: "150ms",
  200: "200ms",
  300: "300ms",
  500: "500ms",
  700: "700ms",
  1e3: "1000ms"
};
var borderRadius = {
  DEFAULT: "0.25rem",
  none: "0",
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  "1/2": "50%",
  full: "9999px"
};
var borderStyle = {
  solid: "solid",
  dotted: "dotted",
  dashed: "dashed"
};
var backfaceVisibility = {
  visible: "visible",
  hidden: "hidden"
};
var boxShadow = {
  DEFAULT: {
    shadowOffset: { width: 0, height: 1 },
    shadowColor: "rgb(0,0,0)",
    shadowRadius: 3,
    shadowOpacity: 0.3,
    elevation: 1
  },
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    shadowOpacity: 0.3,
    shadowColor: "rgb(0,0,0)",
    elevation: 0
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowColor: "rgb(0,0,0)",
    shadowRadius: 3,
    shadowOpacity: 0.3,
    elevation: 1
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowColor: "rgb(0,0,0)",
    shadowRadius: 6,
    shadowOpacity: 0.3,
    elevation: 3
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowColor: "rgb(0,0,0)",
    shadowRadius: 8,
    shadowOpacity: 0.3,
    elevation: 6
  },
  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowColor: "rgb(0,0,0)",
    shadowRadius: 25,
    shadowOpacity: 0.3,
    elevation: 9
  }
};
var easing = {
  DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  "in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
};
var ringWidth = {
  DEFAULT: "1px",
  none: "0"
};
var borderWidth = {
  DEFAULT: "1px",
  .../* @__PURE__ */ createExponentialUnits(8, "px")
};
var zIndex = {
  .../* @__PURE__ */ createLinearUnits(50, "", 1, 0, 10),
  auto: "auto"
};
var overflow = {
  visible: "visible",
  hidden: "hidden",
  none: "scroll"
};
var objectFit = {
  cover: "cover",
  contain: "contain",
  fill: "fill",
  "scale-down": "scale-down"
};
var position = {
  absolute: "absolute",
  relative: "relative"
};

// ../preset-tailwind/build/esm/tailwind-theme/flex.js
var flexGrow = {
  DEFAULT: "1",
  0: "0",
  1: "1"
};
var flexBasis = {
  ...spacing,
  .../* @__PURE__ */ createPercentRatios(2, 6),
  .../* @__PURE__ */ createPercentRatios(12, 12),
  auto: "auto",
  full: "100%"
};
var flex = {
  1: "1 1 0%",
  auto: "1 1 auto",
  initial: "0 1 auto",
  none: "none"
};
var flexDirection = {
  col: "column",
  "col-reverse": "column-reverse",
  row: "row",
  "row-reverse": "row-reverse"
};
var flexWrap = {
  wrap: "wrap",
  "wrap-reverse": "wrap-reverse",
  nowrap: "nowrap"
};
var justifyContent = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
  stretch: "space-stretch"
};
var alignItems = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  auto: "auto",
  stretch: "stretch",
  baseline: "baseline"
};
var alignContent = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  stretch: "stretch",
  between: "space-between",
  around: "space-around"
};

// ../preset-tailwind/build/esm/tailwind-theme/font.js
var fontFamily = {
  sans: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    '"Noto Sans"',
    "sans-serif",
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"'
  ].join(","),
  serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"].join(","),
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    '"Liberation Mono"',
    '"Courier New"',
    "monospace"
  ].join(",")
};
var fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
  "6xl": "3.75rem",
  "7xl": "4.5rem",
  "8xl": "6rem",
  "9xl": "8rem"
};
var textIndent = {
  DEFAULT: "1.5rem",
  xs: "0.5rem",
  sm: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "2.5rem",
  "2xl": "3rem",
  "3xl": "4rem"
};
var textStrokeWidth = {
  DEFAULT: "1.5rem",
  none: "0",
  sm: "thin",
  md: "medium",
  lg: "thick"
};
var textShadow = {
  DEFAULT: ["0 0 1px rgba(0,0,0,0.2)", "0 0 1px rgba(1,0,5,0.1)"],
  none: "0 0 rgba(0,0,0,0)",
  sm: "1px 1px 3px rgba(36,37,47,0.25)",
  md: ["0 1px 2px rgba(30,29,39,0.19)", "1px 2px 4px rgba(54,64,147,0.18)"],
  lg: ["3px 3px 6px rgba(0,0,0,0.26)", "0 0 5px rgba(15,3,86,0.22)"],
  xl: ["1px 1px 3px rgba(0,0,0,0.29)", "2px 4px 7px rgba(73,64,125,0.35)"]
};
var lineHeight = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
  .../* @__PURE__ */ createLinearUnits(10, "rem", 4, 3)
};
var letterSpacing = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em"
};
var fontWeight = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900"
  // int[0, 900] -> int
};
var wordSpacing = letterSpacing;
var textDecorationStyle = {
  solid: "solid",
  double: "double",
  dotted: "dotted"
};
var textDecorationLine = {
  thought: "line-through",
  "under-through": "underline line-through",
  none: "none",
  underline: "underline"
};
var textTransform = {
  capitalize: "capitalize",
  uppercase: "uppercase",
  lowercase: "lowercase"
};
var fontStyle = {
  normal: "normal",
  italic: "italic"
};

// ../preset-tailwind/build/esm/tailwind-theme/image.js
var resizeMode = {
  cover: "cover",
  contain: "contain",
  stretch: "stretch",
  repeat: "repeat",
  center: "center"
};

// ../preset-tailwind/build/esm/tailwind-theme/size.js
var baseSize = {
  ...spacing,
  xs: "20rem",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
  prose: "65ch",
  full: "100%",
  ...createPercentRatios(2, 6),
  ...createPercentRatios(12, 12)
};
var width = {
  auto: "auto",
  ...baseSize,
  screen: "100vw"
};
var maxWidth = {
  ...baseSize,
  none: "none",
  screen: "100vw"
};
var height = {
  ...baseSize,
  auto: "auto",
  screen: "100vh"
};
var maxHeight = {
  ...baseSize,
  none: "none",
  screen: "100vh"
};
var containers = Object.fromEntries(Object.entries(baseSize).map(([k, v]) => [k, `(min-width: ${v})`]));
var aspectRatio = {
  square: "1/1",
  video: "16/9"
};

// ../preset-tailwind/build/esm/tailwind-theme/transform.js
var translate = {
  ...spacing,
  .../* @__PURE__ */ createPercentRatios(2, 4),
  full: "100%"
};
var rotate = {
  .../* @__PURE__ */ createExponentialUnits(2, "deg"),
  // 0: '0deg',
  // 1: '1deg',
  // 2: '2deg',
  .../* @__PURE__ */ createExponentialUnits(12, "deg", 3),
  // 3: '3deg',
  // 6: '6deg',
  // 12: '12deg',
  .../* @__PURE__ */ createExponentialUnits(180, "deg", 45)
  // 45: '45deg',
  // 90: '90deg',
  // 180: '180deg',
};
var skew = {
  .../* @__PURE__ */ createExponentialUnits(2, "deg"),
  // 0: '0deg',
  // 1: '1deg',
  // 2: '2deg',
  .../* @__PURE__ */ createExponentialUnits(12, "deg", 3)
  // 3: '3deg',
  // 6: '6deg',
  // 12: '12deg',
};
var scale = {
  .../* @__PURE__ */ createLinearUnits(150, "", 100, 0, 50),
  // 0: '0',
  // 50: '.5',
  // 150: '1.5',
  .../* @__PURE__ */ createLinearUnits(110, "", 100, 90, 5),
  // 90: '.9',
  // 95: '.95',
  // 100: '1',
  // 105: '1.05',
  // 110: '1.1',
  75: "0.75",
  125: "1.25"
};

// ../preset-tailwind/build/esm/tailwind-theme/transition.js
var transition = {
  DEFAULT: {
    transitionProperty: "color background-color border-color text-decoration-color",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  all: {
    transitionProperty: "all",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  colors: {
    transitionProperty: "color, background-color, border-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  none: {
    transitionProperty: "none",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  opacity: {
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  shadow: {
    transitionProperty: "box-shadow",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  },
  transform: {
    transitionProperty: "transform",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms"
  }
};

// ../preset-tailwind/build/esm/tailwind-theme/default.js
var theme = {
  blockSize: height,
  blur,
  borderRadius,
  boxShadow,
  screens,
  colors,
  containers,
  dropShadow,
  duration,
  easing,
  flexBasis,
  flexGrow,
  fontFamily,
  fontSize,
  fontWeight,
  height,
  inlineSize: width,
  letterSpacing,
  verticalAlign,
  aspectRatio,
  textTransform,
  textAlign,
  fontStyle,
  objectFit,
  lineHeight,
  lineWidth,
  maxBlockSize: maxHeight,
  maxHeight,
  translate,
  rotate,
  skew,
  scale,
  flex,
  flexDirection,
  flexWrap,
  justifyContent,
  overflow,
  maxInlineSize: maxWidth,
  maxWidth,
  minBlockSize: maxHeight,
  minHeight: maxHeight,
  minInlineSize: maxWidth,
  minWidth: maxWidth,
  ringWidth,
  spacing,
  textIndent,
  textShadow,
  resizeMode,
  textStrokeWidth,
  transition,
  verticalBreakpoints,
  width,
  wordSpacing
};

// ../preset-tailwind/build/esm/tailwind-theme/preflight.js
var preflight = {
  "*,::before,::after ": {
    "--tw-translate-x": "0",
    "--tw-translate-y": "0",
    "--tw-rotate": "0",
    "--tw-skew-x": "0",
    "--tw-skew-y": "0",
    "--tw-scale-x": "1",
    "--tw-scale-y": "1",
    "--tw-transform": `translateX(var(--tw-translate-x))
    translateY(var(--tw-translate-y)) rotate(var(--tw-rotate))
    skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x))
    scaleY(var(--tw-scale-y))`
  },
  "::backdrop": {
    "--tw-translate-x": "0",
    "--tw-translate-y": "0",
    "--tw-rotate": "0",
    "--tw-skew-x": "0",
    "--tw-skew-y": "0",
    "--tw-scale-x": "1",
    "--tw-scale-y": "1",
    "--tw-transform": `translateX(var(--tw-translate-x))
    translateY(var(--tw-translate-y)) rotate(var(--tw-rotate))
    skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x))
    scaleY(var(--tw-scale-y))`
  },
  /*
    1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)
    2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)
    */
  "*,::before,::after": {
    boxSizing: "border-box",
    borderWidth: "0",
    borderStyle: "solid",
    borderColor: "currentColor"
  },
  "::before,::after": { "--tw-content": "''" },
  /*
    1. Use a consistent sensible line-height in all browsers.
    2. Prevent adjustments of font size after orientation changes in iOS.
    3. Use a more readable tab size.
    4. Use the user's configured `sans` font-family by default.
    5. Use the user's configured `sans` font-feature-settings by default.
    */
  html: {
    lineHeight: 1.5,
    WebkitTextSizeAdjust: "100%",
    MozTabSize: "4",
    tabSize: 4
    // fontFamily: `theme(fontFamily.sans, ${
    //   (baseTheme.fontFamily as Record<string, string>).sans
    // })` /* 4 */,
    // fontFeatureSettings: 'theme(fontFamily.sans[1].fontFeatureSettings, normal)' /* 5 */,
  },
  /*
    1. Remove the margin in all browsers.
    2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.
    */
  body: {
    margin: "0",
    lineHeight: "inherit"
    /* 2 */
  },
  /*
    1. Add the correct height in Firefox.
    2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)
    3. Ensure horizontal rules are visible by default.
    */
  hr: {
    height: "0",
    color: "inherit",
    /* 2 */
    borderTopWidth: "1px"
    /* 3 */
  },
  /*
    Add the correct text decoration in Chrome, Edge, and Safari.
    */
  "abbr:where([title])": { textDecoration: "underline dotted" },
  /*
    Remove the default font size and weight for headings.
    */
  "h1,h2,h3,h4,h5,h6": { fontSize: "inherit", fontWeight: "inherit" },
  /*
    Reset links to optimize for opt-in styling instead of opt-out.
    */
  a: { color: "inherit", textDecoration: "inherit" },
  /*
    Add the correct font weight in Edge and Safari.
    */
  "b,strong": { fontWeight: "bolder" },
  /*
    1. Use the user's configured `mono` font family by default.
    2. Use the user's configured `mono` font-feature-settings by default.
    3. Correct the odd `em` font sizing in all browsers.
    */
  "code,kbd,samp,pre": {
    // fontFamily: `theme(fontFamily.mono, ${
    //   (baseTheme.fontFamily as Record<string, string>).mono
    // })`,
    fontFeatureSettings: fontFamily.mono,
    fontSize: "1em"
  },
  /*
    Add the correct font size in all browsers.
    */
  small: { fontSize: "80%" },
  /*
    Prevent `sub` and `sup` elements from affecting the line height in all browsers.
    */
  "sub,sup": {
    fontSize: "75%",
    lineHeight: 0,
    position: "relative",
    verticalAlign: "baseline"
  },
  sub: { bottom: "-0.25em" },
  sup: { top: "-0.5em" },
  /*
    1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)
    2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)
    3. Remove gaps between table borders by default.
    */
  table: {
    textIndent: "0",
    borderColor: "inherit",
    borderCollapse: "collapse"
  },
  /*
    1. Change the font styles in all browsers.
    2. Remove the margin in Firefox and Safari.
    3. Remove default padding in all browsers.
    */
  "button,input,optgroup,select,textarea": {
    fontFamily: "inherit",
    fontSize: "100%",
    lineHeight: "inherit",
    color: "inherit",
    margin: "0",
    padding: "0"
  },
  /*
    Remove the inheritance of text transform in Edge and Firefox.
    */
  "button,select": { textTransform: "none" },
  /*
    1. Correct the inability to style clickable types in iOS and Safari.
    2. Remove default button styles.
    */
  "button,[type='button'],[type='reset'],[type='submit']": {
    WebkitAppearance: "button",
    backgroundColor: "transparent",
    backgroundImage: "none"
  },
  /*
    Use the modern Firefox focus style for all focusable elements.
    */
  ":-moz-focusring": { outline: "auto" },
  /*
    Remove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)
    */
  ":-moz-ui-invalid": { boxShadow: "none" },
  /*
    Add the correct vertical alignment in Chrome and Firefox.
    */
  progress: { verticalAlign: "baseline" },
  /*
    Correct the cursor style of increment and decrement buttons in Safari.
    */
  "::-webkit-inner-spin-button,::-webkit-outer-spin-button": {
    height: "auto"
  },
  /*
    1. Correct the odd appearance in Chrome and Safari.
    2. Correct the outline style in Safari.
    */
  "[type='search']": {
    WebkitAppearance: "textfield",
    outlineOffset: "-2px"
    /* 2 */
  },
  /*
    Remove the inner padding in Chrome and Safari on macOS.
    */
  "::-webkit-search-decoration": { WebkitAppearance: "none" },
  /*
    1. Correct the inability to style clickable types in iOS and Safari.
    2. Change font properties to `inherit` in Safari.
    */
  "::-webkit-file-upload-button": {
    WebkitAppearance: "button",
    font: "inherit"
  },
  /*
    Add the correct display in Chrome and Safari.
    */
  summary: { display: "list-item" },
  /*
    Removes the default spacing and border for appropriate elements.
    */
  "blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre": {
    margin: "0"
  },
  fieldset: { margin: "0", padding: "0" },
  legend: { padding: "0" },
  "ol,ul,menu": { listStyle: "none", margin: "0", padding: "0" },
  /*
    Prevent resizing textareas horizontally by default.
    */
  textarea: { resize: "vertical" },
  /*
    1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)
    2. Set the default placeholder color to the user's configured gray 400 color.
    */
  "input::placeholder,textarea::placeholder": {
    opacity: 1,
    color: "#9ca3af"
  },
  /*
    Set the default cursor for buttons.
    */
  'button,[role="button"]': { cursor: "pointer" },
  /*
    Make sure disabled buttons don't get the pointer cursor.
    */
  ":disabled": { cursor: "default" },
  /*
    1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)
    2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)
      This can trigger a poorly considered lint error in some tools but is included by design.
    */
  "img,svg,video,canvas,audio,iframe,embed,object": {
    display: "block",
    verticalAlign: "middle"
  },
  /*
    Constrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)
    */
  "img,video": { maxWidth: "100%", height: "auto" },
  /* Make elements with the HTML hidden attribute stay hidden by default */
  "[hidden]": { display: "none" }
};

// ../preset-tailwind/build/esm/index.js
function presetTailwind({ colors: colors2, disablePreflight } = {}) {
  let userColors = {};
  if (colors2) {
    userColors = {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      black: "#000",
      white: "#fff",
      ...colors2
    };
  } else {
    userColors = colors;
  }
  return {
    // allow other preflight to run
    preflight: disablePreflight ? void 0 : preflight,
    theme: {
      ...tailwind_theme_exports,
      ...theme,
      colors: {
        ...userColors
      }
    },
    rules: themeRules
  };
}
__name(presetTailwind, "presetTailwind");

// test/tailwind.config.ts
defineConfig({
  content: ["./fixtures/**/*.{js,jsx,ts,tsx}"],
  root: {
    rem: 16
  },
  mode: "web",
  theme: {
    extend: {
      screens: {
        sm: {
          min: "200px",
          max: "500px"
        }
      },
      colors: {
        primary: "blue"
      },
      fontFamily: {
        DEFAULT: "Inter-Regular",
        inter: "Inter-Regular",
        "inter-bold": "Inter-Bold",
        "inter-medium": "Inter-Medium",
        sans: "Inter-Regular"
      }
    }
  },
  rules: [matchAnimation("slideIn")],
  presets: [presetTailwind()]
  // animations: [
  //   [
  //     'slideIn',
  //     new Keyframe({
  //       0: { transform: [{ rotateX: '10deg' }] },
  //       50: { transform: [{ rotateX: '45deg' }] },
  //       100: { transform: [{ rotateX: '180deg' }] },
  //     }),
  //   ],
  // ],
});
