import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { useRegisterFcmTokenMutation } from '../store/apiSlice';

export function usePushNotifications() {
  const [registerToken] = useRegisterFcmTokenMutation();

  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          if (token) {
            await registerToken({
              token,
              device: Platform.OS
            }).unwrap();
          }
        }
      } catch (error) {
        console.error('Push Notification Error:', error);
      }
    };

    requestPermissionAndGetToken();

    // Listen to token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      try {
        await registerToken({
          token,
          device: Platform.OS
        }).unwrap();
      } catch (error) {
        console.error('Token Refresh Error:', error);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, [registerToken]);
}
