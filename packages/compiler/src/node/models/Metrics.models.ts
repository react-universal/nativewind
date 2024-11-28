import * as Array from 'effect/Array';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Metric from 'effect/Metric';
import * as MetricBoundaries from 'effect/MetricBoundaries';
import * as MetricLabel from 'effect/MetricLabel';
import { MetricState } from 'effect/MetricState';
import { NegativeInteger, PositiveInteger } from '@native-twin/helpers';

export class CounterMetric<TLabel extends string> {
  readonly metric: Metric.Metric.Counter<number>;
  readonly inc: (add: PositiveInteger) => Effect.Effect<PositiveInteger>;
  readonly dec: (subtract: NegativeInteger) => Effect.Effect<NegativeInteger>;

  constructor(
    readonly label: TLabel,
    readonly description: string,
    readonly logLevel: LogLevel.Literal,
  ) {
    this.metric = Metric.counter(this.label);
    // this.value = Metric.value(this.metric);

    this.inc = (add) => this.metric(Effect.succeed(add));
    this.dec = (subtract) => this.metric(Effect.succeed(subtract));
  }

  get value(): Effect.Effect<MetricState.Counter<number>> {
    return Metric.value(this.metric);
  }
}

export class HistogramMetric<TLabel extends string> {
  readonly metric: Metric.Metric.Histogram<number>;
  readonly inc: (add: PositiveInteger) => Effect.Effect<PositiveInteger>;
  readonly dec: (subtract: NegativeInteger) => Effect.Effect<NegativeInteger>;

  constructor(
    readonly label: TLabel,
    readonly description: string,
    readonly logLevel: LogLevel.Literal,
    readonly boundaries: {
      readonly start: number;
      readonly width: number;
      readonly count: number;
    },
  ) {
    this.metric = Metric.histogram(
      this.label,
      MetricBoundaries.linear(boundaries),
      description,
    );
    // this.value = Metric.value(this.metric);

    this.inc = (add) => this.metric(Effect.succeed(add));
    this.dec = (subtract) => this.metric(Effect.succeed(subtract));
  }

  get value(): Effect.Effect<MetricState.Histogram> {
    return Metric.value(this.metric);
  }
}

export class TimerMetric<TLabel extends string> {
  readonly metric: Metric.Metric.Histogram<Duration.Duration>;

  readonly track: <A>(task: Effect.Effect<A>) => Effect.Effect<A>;

  constructor(
    readonly label: TLabel,
    readonly description: string,
    readonly logLevel: LogLevel.Literal,
    readonly boundaries: [start: number, end: number],
  ) {
    this.metric = Metric.timerWithBoundaries(
      this.label,
      Array.range(...boundaries),
      description,
    );
    // this.value = Metric.value(this.metric);

    this.track = <A>(task: Effect.Effect<A>) => Metric.trackDuration(task, this.metric);
  }

  get value(): Effect.Effect<MetricState.Histogram> {
    return Metric.value(this.metric);
  }
}

export class SummaryMetric<TLabel extends string> {
  readonly metric: Metric.Metric.Summary<number>;

  readonly track: <A extends Effect.Effect<any>>(
    task: A,
  ) => ReturnType<Metric.Metric.Summary<number>>;

  constructor(
    readonly label: TLabel,
    readonly description: string,
    readonly logLevel: LogLevel.Literal,
    readonly config: {
      /** @description Maximum sample age */
      readonly maxAge: Duration.DurationInput;
      /** @description Maximum number of samples to retain */
      readonly maxSize: number;
      /** @description Error margin for quantile calculation */
      readonly error: number;
      /** @description Quantiles to observe (10%, 50%, 90%) */
      readonly quantiles: ReadonlyArray<number>;
    },
  ) {
    this.metric = Metric.summary({
      maxAge: config.maxAge,
      error: config.error,
      maxSize: config.maxSize,
      quantiles: config.quantiles,
      name: this.label,
      description,
    });
    // this.value = Metric.value(this.metric);

    this.track = (task) => this.metric(task);
  }

  get value(): Effect.Effect<MetricState.Summary> {
    return Metric.value(this.metric);
  }
}

export class FrequencyMetric<TLabel extends string> {
  readonly metric: Metric.Metric.Frequency<string>;
  readonly track: <A extends Effect.Effect<any>>(task: A) => Effect.Effect<string>;
  constructor(
    readonly label: TLabel,
    readonly labelValue: string,
    readonly description: string,
    readonly logLevel: LogLevel.Literal,
  ) {
    this.metric = Metric.frequency(this.label, {
      description,
    }).pipe(Metric.taggedWithLabels([MetricLabel.make(this.label, labelValue)]));
    // this.value = Metric.value(this.metric);

    this.track = (task) => this.metric(task);
  }

  get value(): Effect.Effect<MetricState.Frequency> {
    return Metric.value(this.metric);
  }
}
