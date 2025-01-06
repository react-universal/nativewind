import { getCompletionsAtPosition } from './completions.program.js';
import { getDocumentDiagnosticsProgram } from './diagnostics.program.js';
import { getDocumentColors } from './documentColors.program.js';
import { getDocumentHighLightsProgram } from './documentHighlight.program.js';
import { getHoverDetails } from './getHoverDetails.program.js';
import { getCompletionEntryDetails } from './resolveCompletion.program.js';
import { twinCodeActionsProgram } from './twinCodeActions.program.js';

export const languagePrograms = {
  getCompletionsAtPosition,
  getDocumentDiagnosticsProgram,
  getDocumentColors,
  getDocumentHighLightsProgram,
  getHoverDetails,
  getCompletionEntryDetails,
  twinCodeActionsProgram,
};
