import * as Constants from './utils/constants.utils';

/** Documents Service */
export { DocumentsService } from './services/LSPDocuments.service';

/** Language Service */
export { filterTokensFromRules } from './language/utils/completions.maps';
export {
  getCompletionsForTokens,
  languagePrograms,
  getDocumentationMarkdown,
  getCompletionEntryDetailsDisplayParts,
} from './language';
export { TemplateTokenData } from './models/twin/template-token.model';
export { LSPConfigService } from './services/LSPConfig.service';
export { TemplateTokenWithText } from './models/twin/template-token.model';

/** Twin Services */
export { NativeTwinManagerService, parseTemplate } from './native-twin';
export type { TwinRuleCompletion } from './native-twin';

/** Connection Service */
export { LSPConnectionService as ConnectionService } from './services/LSPConnection.service';

/** Vscode Client */
export {
  getDocumentLanguageLocations,
  LanguageCompiler,
  LanguageInput,
} from './extension';

/** Logger */
export { createLspLogger, loggerUtils } from './utils/lsp.logger.service';

export { DEFAULT_PLUGIN_CONFIG } from './utils/constants.utils';

export type { NativeTwinPluginConfiguration } from './utils/constants.utils';

export { Constants };
export { ExtensionConfigSchema } from './schemas';
