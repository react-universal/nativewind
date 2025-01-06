import { CSS_COLORS } from '@native-twin/css';
import { Constants } from '@native-twin/language-service';
import * as vscode from 'vscode';
import {
  CloseAction,
  ErrorAction,
  type ErrorHandler,
  type LanguageClientOptions,
  type ProvideDocumentColorsSignature,
} from 'vscode-languageclient';

const colorNames = Object.keys(CSS_COLORS);

export const onLanguageClientError: ErrorHandler['error'] = async (
  _error,
  message,
  count,
) => {
  return {
    action: ErrorAction.Shutdown,
    handled: true,
    message: `${message ?? 'Language client error'} Count: ${count}`,
  };
};

export const onLanguageClientClosed: ErrorHandler['closed'] = async () => {
  return {
    action: CloseAction.Restart,
    handled: true,
    message: 'Language client closed',
  };
};

export const onProvideDocumentColors = async (
  document: vscode.TextDocument,
  token: vscode.CancellationToken,
  next: ProvideDocumentColorsSignature,
  colorDecoration: vscode.TextEditorDecorationType,
): Promise<vscode.ProviderResult<vscode.ColorInformation[]>> => {
  const colors = await next(document, token);
  if (!colors) return colors;

  const editableColors = colors.filter((color) => {
    const text =
      vscode.workspace.textDocuments
        .find((doc) => doc === document)
        ?.getText(color.range) ?? '';
    return new RegExp(
      `-\\[(${colorNames.join('|')}|((?:#|rgba?\\(|hsla?\\())[^\\]]+)\\]$`,
    ).test(text);
  });

  const nonEditableColors = colors.filter((color) => !editableColors.includes(color));

  const editors = vscode.window.visibleTextEditors.filter(
    (editor) => editor.document === document,
  );

  for (const editor of editors) {
    editor.setDecorations(
      colorDecoration,
      nonEditableColors.map(({ color, range }) => ({
        range: range,
        renderOptions: {
          before: {
            backgroundColor: `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`,
          },
        },
      })),
    );
  }

  return editableColors;
};

export const getDefaultLanguageClientOptions = (data: {
  twinConfigFile: string | undefined;
  workspaceRoot: string | undefined;
}): LanguageClientOptions => {
  return {
    documentSelector: Constants.DOCUMENT_SELECTORS,

    markdown: {
      isTrusted: true,
      supportHtml: true,
    },
    initializationOptions: {
      ...vscode.workspace.getConfiguration(Constants.configurationSection),
      ...data,
      capabilities: {
        completion: {
          dynamicRegistration: false,
          completionItem: {
            snippetSupport: true,
          },
        },
      },
    },
    progressOnInitialization: true,
  };
};
