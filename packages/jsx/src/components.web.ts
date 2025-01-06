import { createStylableComponent, withMappedProps } from './styled/index.js';

const {
  ActivityIndicator: RNActivityIndicator,
  Pressable: RNPressable,
  ScrollView: RNScrollView,
  StatusBar: RNStatusBar,
  Switch: RNSwitch,
  Text: RNText,
  TextInput: RNTextInput,
  SafeAreaView: RNSafeAreaView,
  TouchableOpacity: RNTouchableOpacity,
  View: RNView,
  Image: RNImage,
  TouchableHighlight: RNTouchableHighlight,
  TouchableWithoutFeedback: RNTouchableWithoutFeedback,
  FlatList: RNFlatList,
  ImageBackground: RNImageBackground,
  KeyboardAvoidingView: RNKeyboardAvoidingView,
  VirtualizedList: RNVirtualizedList,
} = require('react-native');

createStylableComponent(RNImage, { className: 'style' });
createStylableComponent(RNPressable, { className: 'style' });
createStylableComponent(RNSafeAreaView, { className: 'style' });
createStylableComponent(RNSwitch, { className: 'style' });
createStylableComponent(RNText, { className: 'style' });
createStylableComponent(RNTouchableHighlight, { className: 'style' });
createStylableComponent(RNTouchableOpacity, { className: 'style' });
createStylableComponent(RNTouchableWithoutFeedback, { className: 'style' });
createStylableComponent(RNView, { className: 'style' });
createStylableComponent(RNActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
createStylableComponent(RNStatusBar, {
  className: { target: false, nativeStyleToProp: { backgroundColor: true } },
});
createStylableComponent(RNScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
createStylableComponent(RNTextInput, {
  className: { target: 'style', nativeStyleToProp: { textAlign: true } },
});

withMappedProps(RNFlatList, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  columnWrapperClassName: 'columnWrapperStyle',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
withMappedProps(RNImageBackground, {
  className: 'style',
  imageClassName: 'imageStyle',
});
withMappedProps(RNKeyboardAvoidingView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
withMappedProps(RNVirtualizedList, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
