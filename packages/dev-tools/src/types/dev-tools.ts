import 'expo/devtools.js';

declare module 'expo/devtools.js' {
  interface EventSubscription {
    remove: () => void;
  }
}
