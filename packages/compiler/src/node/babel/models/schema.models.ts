// import * as ParseResult from 'effect/Schema/ParseResult';
// import * as Schema from 'effect/Schema/Schema';
// import { Effect } from 'effect';
// import { RuntimeComponentEntry } from '@native-twin/css/jsx';
// import { entriesToComponentData, runtimeEntryToCode } from '../utils/code.utils';

// const DeclarationValueSchema = Schema.Union(
//   Schema.String,
//   Schema.Number,
//   Schema.Object,
//   Schema.Array(Schema.Object),
// );
// const SheetDeclarationFields = Object.freeze({
//   prop: Schema.String,
//   value: DeclarationValueSchema,
// });
// const CompiledSheetEntryDeclarationSchema = Schema.TaggedStruct(
//   'COMPILED',
//   SheetDeclarationFields,
// );
// const NotCompiledSheetEntryDeclarationSchema = Schema.TaggedStruct(
//   'NOT_COMPILED',
//   SheetDeclarationFields,
// );

// const RuntimeSheetDeclarationSchema = Schema.Union(
//   CompiledSheetEntryDeclarationSchema,
//   NotCompiledSheetEntryDeclarationSchema,
// );

// const RuntimeGroupSheetSchema = Schema.Record({
//   key: Schema.Literal('base', 'group', 'pointer', 'first', 'last', 'odd', 'even', 'dark'),
//   value: Schema.Array(RuntimeSheetDeclarationSchema),
// });

// export class SheetEntriesSchema extends Schema.Class<SheetEntriesSchema>('SheetEntries')({
//   className: Schema.String,
//   declarations: Schema.Array(RuntimeSheetDeclarationSchema),
//   /** The rule sets (selectors and at-rules). expanded variants `@media ...`, `@supports ...`, `&:focus`, `.dark &` */
//   selectors: Schema.Array(Schema.String),
//   precedence: Schema.Number,
//   important: Schema.Boolean,
//   preflight: Schema.Boolean,
// }) {}

// export class ComponentEntriesSchema extends Schema.Class<ComponentEntriesSchema>(
//   'RuntimeComponentEntry',
// )({
//   classNames: Schema.String,
//   prop: Schema.String,
//   target: Schema.String,
//   templateLiteral: Schema.Union(Schema.String, Schema.Null),
//   rawSheet: RuntimeGroupSheetSchema,
//   entries: Schema.Array(SheetEntriesSchema),
// }) {}

// const transformData = (id: string, entries: RuntimeComponentEntry[]) =>
//   Effect.sync(() => entriesToComponentData(id, entries));

// const getEntry = (entry: RuntimeComponentEntry) =>
//   Effect.try({
//     try: () => runtimeEntryToCode(entry),
//     catch: (e: any) => new Error(e),
//   });
// const transformEntry = Schema.transformOrFail(ComponentEntriesSchema, Schema.String, {
//   strict: true,
//   encode: () =>
//     Effect.succeed(
//       new ComponentEntriesSchema({
//         classNames: '',
//         entries: [],
//         prop: '',
//         rawSheet: {
//           base: [],
//           dark: [],
//           even: [],
//           first: [],
//           group: [],
//           last: [],
//           odd: [],
//           pointer: [],
//         },
//         target: 'asd',
//         templateLiteral: null,
//       }),
//     ),
//   decode: (s, _, ast) =>
//     Effect.mapBoth(getEntry(s), {
//       onFailure: (e: Error) => new ParseResult.Type(ast, s, e.message),
//       onSuccess: (a) => {
//         console.log('AAA: ', a);
//         return a;
//       },
//     }),
// });

// // transformEntry('asd',{} as any).
