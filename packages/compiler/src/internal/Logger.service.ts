import { inspect } from 'node:util';
import * as Doc from '@effect/printer-ansi/AnsiDoc';
import * as FiberId from 'effect/FiberId';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as List from 'effect/List';
import * as LogLevel from 'effect/LogLevel';
import * as LogSpan from 'effect/LogSpan';
import * as Logger from 'effect/Logger';
import * as Option from 'effect/Option';
import * as Str from 'effect/String';
import * as Utils from './ansi.utils.js';

export const TwinCustomLogger = Logger.make((options) => {
  const platform: string = pipe(
    options.annotations,
    HashMap.get('platform'),
    Option.map((x) => `${x}`),
    Option.getOrElse(() => 'METRO'),
    Str.toUpperCase,
    (x) => {
      return Utils.renderDoc(Doc.annotate(Doc.text(`[${x}]`), Utils.getPlatformColor(x)));
    },
  );

  const fiberId = FiberId.threadName(options.fiberId);

  const msgFactory: string[] = [`${options.logLevel.label}:`, platform];
  msgFactory.push(
    Utils.renderDoc(Doc.annotate(Doc.text(fiberId), Utils.Constants.colors.message)),
  );

  if (typeof options.message === 'string') {
    msgFactory.push(
      Utils.renderDoc(
        Doc.annotate(Doc.text(options.message), Utils.getLogLevelColor(options.logLevel)),
      ),
    );
  } else if (Array.isArray(options.message)) {
    msgFactory.push(
      Utils.renderDoc(
        Doc.annotate(
          Doc.text(
            options.message
              .map((x) => (typeof x === 'string' ? x : inspect(x, false, null, true)))
              .join(' '),
          ),
          Utils.getLogLevelColor(options.logLevel),
        ),
      ),
    );
  }

  const spans = options.spans
    .pipe(List.toArray)
    .map((x) => pipe(x, LogSpan.render(x.startTime)));
  if (spans.length > 0) {
    msgFactory.push(Utils.renderDoc(Doc.text(spans.join(' '))));
  }

  const message = msgFactory.join(' ');
  // console.log('OPTIONS: ', inspect(options, false, null, true));

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
