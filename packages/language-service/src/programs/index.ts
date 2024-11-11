import { getCompletionsAtPosition } from './completions.program';
import { getDocumentDiagnosticsProgram } from './diagnostics.program';
import { getDocumentColors } from './documentColors.program';
import { getDocumentHighLightsProgram } from './documentHighlight.program';
import { getHoverDetails } from './getHoverDetails.program';
import { getCompletionEntryDetails } from './resolveCompletion.program';
import { twinCodeActionsProgram } from './twinCodeActions.program';

export const languagePrograms = {
  getCompletionsAtPosition,
  getDocumentDiagnosticsProgram,
  getDocumentColors,
  getDocumentHighLightsProgram,
  getHoverDetails,
  getCompletionEntryDetails,
  twinCodeActionsProgram,
};
