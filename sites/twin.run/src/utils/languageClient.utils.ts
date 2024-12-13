import { CSS_COLORS } from '@native-twin/css';
import * as vscode from 'vscode';
import {
  CloseAction,
  ErrorAction,
  type ErrorHandler,
  type ProvideDocumentColorsSignature,
} from 'vscode-languageclient';

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

const colorNames = Object.keys(CSS_COLORS);
export const getColorDecoration = () =>
  vscode.window.createTextEditorDecorationType({
    before: {
      width: '0.8em',
      height: '0.8em',
      contentText: ' ',
      border: '0.1em solid',
      margin: '0.1em 0.2em 0',
    },
    dark: {
      before: {
        borderColor: '#eeeeee',
      },
    },
    light: {
      before: {
        borderColor: '#000000',
      },
    },
  });

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
