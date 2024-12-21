// import './wdyr';
// import './globals.css';
import { registerRootComponent } from 'expo';
import App from './App';
import twinConfig from './tailwind.config';
import { setup } from '@native-twin/core';

setup(twinConfig);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

registerRootComponent(App); 
