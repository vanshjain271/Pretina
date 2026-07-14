import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalCart from './src/components/GlobalCart';
import FloatingCartButton from './src/components/FloatingCartButton';

import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

SplashScreen.preventAutoHideAsync().catch(() => {});

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'pretina://', 'https://pretina.app', 'http://pretina.app'],
  config: {
    screens: {
      Main: {
        screens: {
          ProductDetail: 'product/:productId',
        }
      }
    }
  }
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
          <GlobalCart />
          <FloatingCartButton />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
