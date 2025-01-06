import {
  ScrollViewProps,
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
  VirtualizedListProps,
  StyleSheetProperties,
  StyleSheet,
} from 'react-native';

declare module '@react-native/virtualized-lists' {
  export interface VirtualizedListWithoutRenderItemProps<ItemT> extends ScrollViewProps {
    ListFooterComponentClassName?: string;
    ListHeaderComponentClassName?: string;
  }
}

declare module 'react-native' {
  interface ScrollViewProps
    extends ViewProps,
      ScrollViewPropsIOS,
      ScrollViewPropsAndroid,
      Touchable {
    debug?: boolean;
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }

  namespace StyleSheet {
    function getSheet(): {
      textContent: string;
      id: string;
    };
  }

  interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
    debug?: boolean;
    columnWrapperClassName?: string;
  }
  interface ImageBackgroundProps extends ImagePropsBase {
    debug?: boolean;
    imageClassName?: string;
  }
  interface ImagePropsBase {
    debug?: boolean;
    className?: string;
  }
  interface ViewProps {
    debug?: boolean;
    className?: string;
  }
  interface TextInputProps {
    debug?: boolean;
    placeholderClassName?: string;
  }
  interface TextProps {
    debug?: boolean;
    className?: string;
  }
  interface SwitchProps {
    debug?: boolean;
    className?: string;
  }
  interface InputAccessoryViewProps {
    debug?: boolean;
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    debug?: boolean;
    className?: string;
  }
  interface StatusBarProps {
    debug?: boolean;
    className?: string;
  }
  interface KeyboardAvoidingViewProps extends ViewProps {
    debug?: boolean;
    contentContainerClassName?: string;
  }
  interface ModalBaseProps {
    debug?: boolean;
    presentationClassName?: string;
  }
}
