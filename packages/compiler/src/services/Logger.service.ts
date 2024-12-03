import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import { List } from 'effect';
import * as FiberId from 'effect/FiberId';
import { apply, pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as LogLevel from 'effect/LogLevel';
import * as LogSpan from 'effect/LogSpan';
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
const METRO_COLOR = Ansi.combine(Ansi.combine(Ansi.bgMagenta, Ansi.white), Ansi.bold);

const render = (doc: Doc.AnsiDoc): string => Doc.render(doc, { style: 'pretty' });

const getPlatformColor = (platform: string) => {
  if (platform.toLocaleUpperCase() === 'WEB') return WEB_COLOR;
  if (platform.toLocaleUpperCase() === 'IOS') return IOS_COLOR;
  if (platform.toLocaleUpperCase() === 'ANDROID') return ANDROID_COLOR;
  return METRO_COLOR;
};

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

  const msgFactory: string[] = [`${options.logLevel.label}:`, platform];
  msgFactory.push(
    render(Doc.annotate(Doc.text(fiberId), Ansi.combine(Ansi.white)(Ansi.bgWhiteBright))),
  );

  if (typeof options.message === 'string') {
    msgFactory.push(
      render(Doc.annotate(Doc.text(options.message), getLogLevelColor(options.logLevel))),
    );
  } else if (Array.isArray(options.message)) {
    msgFactory.push(
      render(
        Doc.annotate(
          Doc.text(options.message.join(' ')),
          getLogLevelColor(options.logLevel),
        ),
      ),
    );
  }

  const spans = options.spans
    .pipe(List.toArray)
    .map((x) => pipe(x, LogSpan.render(x.startTime)));
  if (spans.length > 0) {
    msgFactory.push(render(Doc.text(spans.join(' '))));
  }

  const message = msgFactory.join(' ');

  switch (options.logLevel) {
    case LogLevel.Trace:
      console.trace(message);
      return;
    case LogLevel.Debug:
      console.debug(message + 'asdasda kasjdlaskdj lajsdlasjdlajdl jlasjdlasjdl');
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

// type InferParam<T> = T extends (arg: infer R) => any ? R : never;
// type LoggerScopes = 'web' | 'android' | 'iOS' | 'metro' | 'babel' | (string & {});
// class TwinLogger extends Context.Tag('utils/TwinLogger')<
//   TwinLogger,
//   {
//     readonly log: (...data: any[]) => Effect.Effect<void>;
//     readonly warn: (...data: any[]) => Effect.Effect<void>;
//     readonly error: (...data: any[]) => Effect.Effect<void>;
//     readonly debug: (...data: any[]) => Effect.Effect<void>;
//     readonly trace: (...data: any[]) => Effect.Effect<void>;
//   }
// >() {}

// const logLevel = (level: LogLevel.LogLevel) => {
//   const color = getLogLevelColor(level);
//   return render(Doc.annotate(Doc.text(`${level.label.toUpperCase()}: `), color));
// };

// const platform = (platform: LoggerScopes) => {
//   return render(
//     Doc.annotate(
//       Doc.text(`[${platform.toLocaleUpperCase()}]`),
//       getPlatformColor(platform),
//     ),
//   );
// };

// function makeLoggerTemplate<T extends ((any: any) => any)[]>(
//   strings: TemplateStringsArray,
//   ...placeholders: T
// ) {
//   return function template(...tokens: { [K in keyof T]: InferParam<T[K]> }) {
//     const results = Array(strings.length + tokens.length);

//     for (let i = 0; i < tokens.length; i++) {
//       results[i * 2] = strings[i];
//       const templateArg = tokens[i];
//       results[i * 2 + 1] = placeholders[i](templateArg);
//     }

//     results[results.length - 1] = strings[strings.length - 1];

//     return results.join('');
//   };
// }

// const logTemplate = makeLoggerTemplate`${logLevel}${platform}`;
// const ll = logTemplate(LogLevel.Debug, 'android'); // ?
// console.log(ll);
