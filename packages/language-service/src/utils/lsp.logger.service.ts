import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import * as AnsiColor from '@effect/printer-ansi/Color';
import * as FiberId from 'effect/FiberId';
import { apply, pipe } from 'effect/Function';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';

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
    if (Array.isArray(options.message)) {
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

export const loggerUtils = {
  getMessageColor,
  render,
  messageConfig,
  scopeTextConfig,
};
