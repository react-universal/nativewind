import { inspect } from 'util';
import { LSPConnectionService } from '@native-twin/language-service';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';

// export const loggerLayer = (connection: Connection) =>
//   Logger.replace(Logger.defaultLogger, createConnectionLogger(connection));

export const sendDebugLog = <T extends object>(message: string, payload: T) =>
  Effect.logDebug(`${message} \n payload: ${inspect(payload, false, null, true)}`);

/**
 * @domain `Server`
 * @category Logger
 * @group Services
 */
export const LoggerLive = Logger.replaceEffect(
  Logger.jsonLogger,
  Effect.gen(function* () {
    const Connection = yield* LSPConnectionService;
    return Logger.make((options) => {
      const logService = Connection.console;
      const message = Logger.logfmtLogger.log(options);
      switch (options.logLevel) {
        case LogLevel.Trace:
          Connection.tracer.log(message);
          return;
        case LogLevel.Debug:
          logService.debug(`${message} DEBUG WORK`);
          return;
        case LogLevel.Warning:
          logService.warn(message);
          return;
        case LogLevel.Error:
        case LogLevel.Fatal:
          logService.error(message);
          return;
        default:
          logService.info(`${message} INFO WORK`);
          return;
      }
    });
  }),
);
