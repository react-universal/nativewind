import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import { apply, pipe } from 'effect/Function';
import * as LogLevel from 'effect/LogLevel';
const WEB_COLOR = pipe(
  Ansi.combine(Ansi.bgBlue),
  apply(Ansi.blueBright),
  Ansi.combine(Ansi.bold),
);
const IOS_COLOR = pipe(
  Ansi.combine(Ansi.bgCyan),
  apply(Ansi.cyanBright),
  Ansi.combine(Ansi.bold),
);
const ANDROID_COLOR = pipe(
  Ansi.combine(Ansi.bgGreen),
  apply(Ansi.greenBright),
  Ansi.combine(Ansi.bold),
);
const METRO_COLOR = Ansi.combine(Ansi.combine(Ansi.bgMagenta, Ansi.white), Ansi.bold);
const MESSAGE_COLOR = Ansi.combine(Ansi.white)(Ansi.bgWhiteBright);

const renderDoc = (doc: Doc.AnsiDoc): string => Doc.render(doc, { style: 'pretty' });

const getLogLevelColor = (logLevel: LogLevel.LogLevel) => {
  switch (logLevel) {
    case LogLevel.Debug:
      return Ansi.blue;
    case LogLevel.Error:
      return Ansi.redBright;
    case LogLevel.Info:
      return Ansi.whiteBright;
    default:
      return Ansi.blackBright;
  }
};

const getPlatformColor = (platform: string) => {
  if (platform.toLocaleUpperCase() === 'WEB') return WEB_COLOR;
  if (platform.toLocaleUpperCase() === 'IOS') return IOS_COLOR;
  if (platform.toLocaleUpperCase() === 'ANDROID') return ANDROID_COLOR;
  return METRO_COLOR;
};

export const Constants = {
  colors: {
    web: WEB_COLOR,
    ios: IOS_COLOR,
    android: ANDROID_COLOR,
    metro: METRO_COLOR,
    message: MESSAGE_COLOR,
  },
};

export { renderDoc, getLogLevelColor, getPlatformColor };
