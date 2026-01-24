import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  private constructor() { }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('🔔 Notifications skipped on web');
      return true;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'SOPAN Payments',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#14F195',
        });
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Failed to get notification permissions:', error);
      return false;
    }
  }

  async notifyPaymentReceived(amount: number, sender: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Payment Received',
        body: `You received ${amount} XLM from ${sender.substring(0, 8)}...`,
        data: { type: 'payment_received', amount, sender },
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  async notifyPaymentSent(amount: number, recipient: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Payment Sent',
        body: `Sent ${amount} XLM to ${recipient.substring(0, 8)}...`,
        data: { type: 'payment_sent', amount, recipient },
      },
      trigger: null,
    });
  }

  async notifyTransactionConfirmed(txHash: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Transaction Confirmed',
        body: 'Your transaction has been confirmed on Stellar',
        data: { type: 'confirmed', txHash },
      },
      trigger: null,
    });
  }

  async notifySyncComplete(count: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Sync Complete',
        body: `${count} offline transaction${count > 1 ? 's' : ''} synced to blockchain`,
        data: { type: 'sync_complete', count },
      },
      trigger: null,
    });
  }

  async notifyBluetoothPaymentRequest(amount: number, sender: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Bluetooth Payment Request',
        body: `${sender.substring(0, 8)}... wants to send you ${amount} SOL`,
        data: { type: 'bluetooth_request', amount, sender },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  }
}
