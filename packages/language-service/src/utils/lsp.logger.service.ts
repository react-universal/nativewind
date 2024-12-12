import { inspect } from 'util';
import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import * as AnsiColor from '@effect/printer-ansi/Color';
import * as RA from 'effect/Array';
import * as FiberId from 'effect/FiberId';
import { apply, pipe } from 'effect/Function';
import * as Iterable from 'effect/Iterable';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import * as Str from 'effect/String';

const scopeTextConfig = pipe(
  Ansi.combine(Ansi.bgBlue),
  apply(Ansi.blackBright),
  Ansi.combine(Ansi.bold),
);
const fiberText = Ansi.combine(Ansi.white)(Ansi.bgWhiteBright);
const messageConfig = Ansi.color(AnsiColor.white);

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

const render = (doc: Doc.AnsiDoc): string => Doc.render(doc, { style: 'pretty' });

export const createLspLogger = (scope: string) =>
  Logger.make((options) => {
    const fiberId = FiberId.threadName(options.fiberId);

    const msgFactory: Doc.Doc<Ansi.Ansi>[] = [];

    if (typeof options.message === 'string') {
      msgFactory.push(Doc.text(options.message).pipe(Doc.annotate(messageConfig)));
    }
    if (RA.isArray(options.message)) {
      msgFactory.push(
        Doc.text(options.message.join(' ')).pipe(Doc.annotate(messageConfig)),
      );
    }

    const doc = Doc.hsep([
      Doc.text(scope).pipe(
        Doc.annotate(scopeTextConfig),
        Doc.annotate(getMessageColor(options.logLevel)),
      ),
      Doc.text(`{${fiberId}}`).pipe(Doc.annotate(fiberText)),
      ...msgFactory,
    ]);
    const message = render(doc);

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

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const logFormat = (x: any) =>
  pipe(
    inspect(x, {
      depth: null,
      sorted: true,
      compact: true,
    }),
    Str.linesIterator,
    Iterable.map(Str.padStart(5)),
    RA.fromIterable,
  );

export const loggerUtils = {
  getMessageColor,
  render,
  logFormat,
  messageConfig,
  scopeTextConfig,
};
