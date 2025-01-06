import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import * as AnsiColor from '@effect/printer-ansi/Color';
import * as FiberId from 'effect/FiberId';
import { apply, pipe } from 'effect/Function';
import * as List from 'effect/List';
import * as LogLevel from 'effect/LogLevel';
import * as LogSpan from 'effect/LogSpan';
import * as Logger from 'effect/Logger';

const scopeText = pipe(
  Ansi.combine(Ansi.bgBlue),
  apply(Ansi.blackBright),
  Ansi.combine(Ansi.bold),
);
const fiberText = Ansi.combine(Ansi.white)(Ansi.bgWhiteBright);
const messageConfig = Ansi.color(AnsiColor.white);
const dashes = Doc.text(Array.from({ length: 32 - 2 }, () => '-').join(''));

const createDashes = (size: number) =>
  Doc.vcat([
    Doc.spaces(size + 2).pipe(Doc.annotate(Ansi.underlined)),
    Doc.hcat([
      Doc.vbar,
      Doc.vbar,
      Doc.text(Array.from({ length: size - 2 }, () => '-').join('')),
      Doc.vbar,
      Doc.vbar,
    ]).pipe(Doc.annotate(Ansi.underlined)),
  ]);

const hr = Doc.hcat([Doc.vbar, dashes, Doc.vbar]);

const printKeyValuePair = <A>(first: Doc.Doc<A>, sec: Doc.Doc<A>, size = 15) => {
  return Doc.hsep([Doc.fillBreak(first, size), Doc.text('::'), sec]);
};

const render = (doc: Doc.AnsiDoc): string => Doc.render(doc, { style: 'pretty' });

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

  const spans = options.spans
    .pipe(List.toArray)
    .map((x) => pipe(x, LogSpan.render(x.startTime)));
  if (spans.length > 0) {
    msgFactory.push(Doc.text(spans.join(' ')));
  }

  const doc = Doc.hsep([
    Doc.text('[twin-builder]').pipe(
      Doc.annotate(scopeText),
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
  scopeText,
  getMessageColor,
  createDashes,
  render,
  dashes,
  hr,
  printKeyValuePair,
};

export const TwinLogger = Logger.replace(Logger.defaultLogger, TwinCustomLogger);
