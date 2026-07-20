import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { useRegisterFcmTokenMutation } from '../store/apiSlice';
import { useNavigation } from '@react-navigation/native';

export function usePushNotifications() {
  const [registerToken] = useRegisterFcmTokenMutation();
  const navigation = useNavigation();

  useEffect(() => {
    const handleNotificationOpen = (remoteMessage) => {
      console.log('Notification caused app to open', remoteMessage);
      if (remoteMessage?.data) {
        const { linkType, linkId, type, orderId } = remoteMessage.data;
        // Handle order status update notifications
        if (type === 'ORDER_UPDATE' && orderId) {
          navigation.navigate('Orders');
          return;
        }
        // Handle product/category deep links
        if (linkType === 'product' && linkId) {
          navigation.navigate('ProductDetail', { productId: linkId });
        } else if (linkType === 'category' && linkId) {
          navigation.navigate('CategoryProducts', { categoryId: linkId });
        }
      }
    };

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


    // Handle background notification opens
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(handleNotificationOpen);

    // Handle quit state notification opens
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        handleNotificationOpen(remoteMessage);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeOnNotificationOpenedApp();
    };
  }, [registerToken, navigation]);
}
