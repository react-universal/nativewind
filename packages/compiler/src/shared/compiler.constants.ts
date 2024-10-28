type Prop = string;
type Target = string;
export interface MappedComponent {
  name: string;
  config: Record<Prop, Target>;
}
const globalMappedComponents: MappedComponent[] = [];

const createStylableComponent = <T extends Record<Prop, Target>>(
  component: string,
  styles: T,
) => {
  const mapped = {
    name: component,
    config: styles,
  };
  globalMappedComponents.push(mapped);
  return mapped;
};

const createHandler = () => {
  createStylableComponent('Image', { className: 'style' });
  createStylableComponent('Pressable', { className: 'style' });
  createStylableComponent('SafeAreaView', { className: 'style' });
  createStylableComponent('Switch', { className: 'style' });
  createStylableComponent('Text', { className: 'style' });
  createStylableComponent('TouchableHighlight', { className: 'style' });
  createStylableComponent('TouchableOpacity', { className: 'style' });
  createStylableComponent('TouchableWithoutFeedback', { className: 'style' });
  createStylableComponent('View', { className: 'style' });
  createStylableComponent('ActivityIndicator', {
    className: 'style',
  });
  createStylableComponent('StatusBar', {
    className: 'style',
  });
  createStylableComponent('ScrollView', {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
    indicatorClassName: 'indicatorStyle',
  });
  createStylableComponent('TextInput', {
    className: 'style',
  });

  createStylableComponent('FlatList', {
    className: 'style',
    ListFooterComponentClassName: 'ListFooterComponentStyle',
    ListHeaderComponentClassName: 'ListHeaderComponentStyle',
    columnWrapperClassName: 'columnWrapperStyle',
    contentContainerClassName: 'contentContainerStyle',
    indicatorClassName: 'indicatorStyle',
  });
  createStylableComponent('ImageBackground', {
    className: 'style',
    imageClassName: 'imageStyle',
  });
  createStylableComponent('KeyboardAvoidingView', {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
  createStylableComponent('VirtualizedList', {
    className: 'style',
    ListFooterComponentClassName: 'ListFooterComponentStyle',
    ListHeaderComponentClassName: 'ListHeaderComponentStyle',
    contentContainerClassName: 'contentContainerStyle',
    indicatorClassName: 'indicatorStyle',
  });
  return globalMappedComponents;
};

export const mappedComponents = createHandler();
export const commonMappedAttribute = { className: 'style' };

export const createCommonMappedAttribute = (tagName: string) => {
  return createStylableComponent(tagName, commonMappedAttribute);
};
