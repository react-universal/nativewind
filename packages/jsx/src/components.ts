import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  TouchableHighlight,
  TouchableWithoutFeedback,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  VirtualizedList,
} from 'react-native';
import { withMappedProps, createStylableComponent } from './styled/index.js';

createStylableComponent(Image, { className: 'style' });
createStylableComponent(Pressable, { className: 'style' });
createStylableComponent(SafeAreaView, { className: 'style' });
createStylableComponent(Switch, { className: 'style' });
createStylableComponent(Text, { className: 'style' });
createStylableComponent(TouchableHighlight, { className: 'style' });
createStylableComponent(TouchableOpacity, { className: 'style' });
createStylableComponent(TouchableWithoutFeedback, { className: 'style' });
createStylableComponent(View, { className: 'style' });
createStylableComponent(ActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
createStylableComponent(StatusBar, {
  className: { target: false, nativeStyleToProp: { backgroundColor: true } },
});
createStylableComponent(ScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
createStylableComponent(TextInput, {
  className: 'style',
});

withMappedProps(FlatList, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  columnWrapperClassName: 'columnWrapperStyle',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
withMappedProps(ImageBackground, {
  className: 'style',
  imageClassName: 'imageStyle',
});
withMappedProps(KeyboardAvoidingView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
withMappedProps(VirtualizedList, {
  className: 'style',
  ListFooterComponentClassName: 'ListFooterComponentStyle',
  ListHeaderComponentClassName: 'ListHeaderComponentStyle',
  contentContainerClassName: 'contentContainerStyle',
  indicatorClassName: 'indicatorStyle',
});
