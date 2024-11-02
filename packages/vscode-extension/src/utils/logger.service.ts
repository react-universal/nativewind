import * as Ansi from '@effect/printer-ansi/Ansi';
import * as Doc from '@effect/printer/Doc';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import * as Predicate from 'effect/Predicate';
import { inspect } from 'util';
import * as vscode from 'vscode';
import { Constants, loggerUtils } from '@native-twin/language-service';

/**
 * @domain `Client`
 * @category Logger
 * @group Services
 */
export const ClientCustomLogger = Logger.replaceScoped(
  Logger.defaultLogger,
  Effect.gen(function* () {
    const channel = yield* Effect.acquireRelease(
      Effect.sync(() =>
        vscode.window.createOutputChannel(Constants.extensionChannelName, {
          log: true,
        }),
      ),
      (channel) => Effect.sync(() => channel.dispose()),
    );
    channel.replace('');

    return Logger.make((options) => {
      let message = '';
      if (typeof options.message === 'string') {
        message = options.message;
      }
      if (Array.isArray(options.message)) {
        message = options.message.map((x) => inspect(x)).join(' ');
      }
      if (Predicate.isRecord(options.message)) {
        message = inspect(options.message, false, null, false);
      }

      switch (options.logLevel) {
        case LogLevel.Trace:
          channel.trace(`${message}`);
          break;
        case LogLevel.Debug:
          channel.debug(message);
          break;
        case LogLevel.Warning:
          channel.warn(message);
          break;
        case LogLevel.Error:
        case LogLevel.Fatal:
          channel.error(message);
          break;
        default:
          channel.info(message);
          break;
      }
    });
  }),
);

export const formatLogMessage = (options: {
  logLevel: LogLevel.LogLevel;
  message: any;
}) => {
  const msgFactory: Doc.Doc<Ansi.Ansi>[] = [];

  if (typeof options.message === 'string') {
    msgFactory.push(
      Doc.text(options.message).pipe(Doc.annotate(loggerUtils.messageConfig)),
    );
  }
  if (Array.isArray(options.message)) {
    msgFactory.push(
      Doc.text(options.message.join(' ')).pipe(Doc.annotate(loggerUtils.messageConfig)),
    );
  }

  const doc = Doc.hsep([
    Doc.text(`[Twin Language Client]`).pipe(
      Doc.annotate(loggerUtils.scopeTextConfig),
      Doc.annotate(loggerUtils.getMessageColor(options.logLevel)),
    ),
    // Doc.text(`{${fiberId}}`).pipe(Doc.annotate(fiberText)),
    ...msgFactory,
  ]);
  return loggerUtils.render(doc.pipe(Doc.unAnnotate));
};
