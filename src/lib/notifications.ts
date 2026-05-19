// src/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const NOTIF_ID = {
  MINING_DONE: 'ash-mining-done',
  NORMAL_BOOST_DONE: 'ash-normal-boost-done',
  PREMIUM_BOOST_DONE: 'ash-premium-boost-done',
  PREMIUM_BOOST_WARNING: 'ash-premium-boost-warning',
  MINING_REMINDER: 'ash-mining-reminder',
};

export async function setupNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[NOTIF] Hanya jalan di physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[NOTIF] Permission ditolak');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ash-mining', {
      name: 'ASH Mining Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fbbf24',
    });
    await Notifications.setNotificationChannelAsync('ash-boost', {
      name: 'ASH Boost Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00f2ff',
    });
  }

  console.log('[NOTIF] Setup complete');
  return true;
}

async function safeCancel(id: string) {
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch (_) {}
}

async function scheduleAfterSeconds(
  id: string,
  seconds: number,
  title: string,
  body: string,
  channelId: string,
  data: Record<string, unknown>,
) {
  if (seconds <= 0) return;
  await safeCancel(id);

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: true,
      data,
      ...(Platform.OS === 'android' ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.floor(seconds)),
      repeats: false,
    },
  });
}

async function scheduleDailyAt(
  id: string,
  hour: number,
  minute: number,
  title: string,
  body: string,
  channelId: string,
) {
  await safeCancel(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleMiningDoneNotification(startTimeMs: number) {
  const MINING_DURATION_MS = 6 * 60 * 60 * 1000;
  const seconds = (startTimeMs + MINING_DURATION_MS - Date.now()) / 1000;
  await scheduleAfterSeconds(
    NOTIF_ID.MINING_DONE, seconds,
    'Mining Selesai!',
    'Sesi mining ASH kamu udah kelar. Klaim hasilnya sekarang!',
    'ash-mining',
    { type: 'mining_done' },
  );
}

export async function cancelMiningDoneNotification() {
  await safeCancel(NOTIF_ID.MINING_DONE);
}

export async function scheduleNormalBoostDoneNotification(boostEndTimeMs: number) {
  const seconds = (boostEndTimeMs - Date.now()) / 1000;
  await scheduleAfterSeconds(
    NOTIF_ID.NORMAL_BOOST_DONE, seconds,
    'Standard Boost Habis',
    'Boost gratis kamu sudah expired. Tonton iklan lagi untuk aktifkan ulang!',
    'ash-boost',
    { type: 'normal_boost_done' },
  );
}

export async function schedulePremiumBoostDoneNotification(boostEndTimeMs: number) {
  const seconds = (boostEndTimeMs - Date.now()) / 1000;

  if (seconds > 3600) {
    await scheduleAfterSeconds(
      NOTIF_ID.PREMIUM_BOOST_WARNING, seconds - 3600,
      'Premium Boost Mau Habis!',
      'Premium Boost berakhir dalam 1 jam. Siapkan 14 ASH untuk perpanjang!',
      'ash-boost',
      { type: 'premium_boost_warning' },
    );
  }

  await scheduleAfterSeconds(
    NOTIF_ID.PREMIUM_BOOST_DONE, seconds,
    'Premium Boost Habis',
    'Boost premium kamu sudah berakhir. Aktifkan lagi untuk hashrate maksimal!',
    'ash-boost',
    { type: 'premium_boost_done' },
  );
}

export async function cancelBoostNotifications() {
  await Promise.all([
    safeCancel(NOTIF_ID.NORMAL_BOOST_DONE),
    safeCancel(NOTIF_ID.PREMIUM_BOOST_DONE),
    safeCancel(NOTIF_ID.PREMIUM_BOOST_WARNING),
  ]);
}

export async function scheduleDailyMiningReminder() {
  await scheduleDailyAt(
    NOTIF_ID.MINING_REMINDER, 8, 0,
    'Jangan Lupa Mining!',
    'ASH kamu belum ditambang hari ini. Buka app dan mulai sekarang!',
    'ash-mining',
  );
}
