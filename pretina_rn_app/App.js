import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

import AnimatedSplashScreen from './src/screens/AnimatedSplashScreen';
import { useEffect, useState } from 'react';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Here you can do any pre-loading operations (fonts, api checks, etc.)
        // We'll simulate a slight delay just to ensure the native splash shows briefly
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  return (
    <AnimatedSplashScreen isAppReady={appIsReady}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    </AnimatedSplashScreen>
  );
}
