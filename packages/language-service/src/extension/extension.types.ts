export type Logger = (message: string) => void;

export interface State {
  hasConfigFile?: boolean;
}
