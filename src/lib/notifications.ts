import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log('EAS project ID not configured');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

export function notifyNodeStarted() {
  sendLocalNotification(
    'Node Started',
    'Your syndicate node is now running and earning rewards.',
    { type: 'node_started' }
  );
}

export function notifyRewardReceived(amount: number) {
  sendLocalNotification(
    'Reward Received',
    `You earned ${amount.toFixed(6)} ASH from your node.`,
    { type: 'reward_received', amount }
  );
}

export function notifyNodeDown() {
  sendLocalNotification(
    'Node Offline',
    'Your syndicate node has stopped. Check your connection.',
    { type: 'node_down' }
  );
}

export function notifyStakeConfirmed(amount: number, product: string) {
  sendLocalNotification(
    'Stake Confirmed',
    `${amount} ASH staked in ${product}. Start earning rewards!`,
    { type: 'stake_confirmed', amount }
  );
}

export async function setupNotifications(): Promise<boolean> {
  const token = await registerForPushNotifications();
  return token !== null;
}

export async function scheduleMiningDoneNotification(_startTime?: number): Promise<void> {}
export async function scheduleDailyMiningReminder(): Promise<void> {}
export async function cancelMiningDoneNotification(): Promise<void> {}
export async function scheduleNormalBoostDoneNotification(_endTime?: number): Promise<void> {}
export async function schedulePremiumBoostDoneNotification(_endTime?: number): Promise<void> {}
