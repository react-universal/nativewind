import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import * as FiberId from 'effect/FiberId';
import { apply, pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import * as Option from 'effect/Option';
import * as String from 'effect/String';

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
const METRO_COLOR = pipe(
  Ansi.combine(Ansi.bgYellow),
  apply(Ansi.yellowBright),
  Ansi.combine(Ansi.bold),
);

const render = (doc: Doc.AnsiDoc): string => Doc.render(doc, { style: 'pretty' });

const getPlatformColor = (platform: string) => {
  if (platform === 'WEB') return WEB_COLOR;
  if (platform === 'IOS') return IOS_COLOR;
  if (platform === 'ANDROID') return ANDROID_COLOR;
  return METRO_COLOR;
};

const getMessageColor = (logLevel: LogLevel.LogLevel) => {
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

const TwinCustomLogger = Logger.make((options) => {
  const platform: string = pipe(
    options.annotations,
    HashMap.get('platform'),
    Option.map((x) => `${x}`),
    Option.getOrElse(() => 'METRO'),
    String.toUpperCase,
    (x) => {
      return render(Doc.annotate(Doc.text(`[${x}]`), getPlatformColor(x)));
    },
  );
  const fiberId = FiberId.threadName(options.fiberId);

  const msgFactory: string[] = [platform];
  msgFactory.push(
    render(Doc.annotate(Doc.text(fiberId), Ansi.combine(Ansi.white)(Ansi.bgWhiteBright))),
  );

  if (typeof options.message === 'string') {
    msgFactory.push(
      render(Doc.annotate(Doc.text(options.message), getMessageColor(options.logLevel))),
    );
  } else if (Array.isArray(options.message)) {
    msgFactory.push(
      render(
        Doc.annotate(
          Doc.text(options.message.join(' ')),
          getMessageColor(options.logLevel),
        ),
      ),
    );
  }
  msgFactory.push();

  const message = msgFactory.join(' ');

  switch (options.logLevel) {
    case LogLevel.Trace:
      console.trace(message);
      return;
    case LogLevel.Debug:
      console.debug(message);
      return;
    case LogLevel.Warning:
      console.warn(message);
      return;
    case LogLevel.Error:
    case LogLevel.Fatal:
      console.error(message);
      return;
    default:
      console.info(message);
      return;
  }
});

export const twinLoggerLayer = Logger.replace(Logger.defaultLogger, TwinCustomLogger);
