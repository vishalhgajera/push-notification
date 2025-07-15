import React, { useEffect, useRef, useState } from 'react';
import { Button, Platform, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token || ''));
    // Check and set initial permission status
    Notifications.getPermissionsAsync().then(({ status }) => setPermissionStatus(status));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Expo Push Token:</Text>
      <Text selectable style={{ marginBottom: 16 }}>{expoPushToken || 'Fetching token...'}</Text>
      <Text style={{ marginBottom: 8 }}>Notification Permission Status: <Text style={{ fontWeight: 'bold' }}>{permissionStatus}</Text></Text>
      <Button
        title="Grant Notification Permission"
        onPress={async () => {
          const { status } = await Notifications.requestPermissionsAsync();
          setPermissionStatus(status);
          alert(`Notification permission: ${status}`);
        }}
      />
      <Button
        title="Copy Token"
        onPress={() => {
          if (expoPushToken) {
            Clipboard.setStringAsync(expoPushToken);
          }
        }}
      />
      <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
        <Text style={{ fontWeight: 'bold' }}>Last Notification:</Text>
        <Text style={{ textAlign: 'center' }}>
          {notification ? JSON.stringify(notification.request.content) : 'No notification received yet.'}
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);
  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
