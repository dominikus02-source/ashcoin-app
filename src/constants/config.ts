export const appConfig = {
  name: 'ASH Finance',
  shortName: 'ASH',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '2.0.0',
  environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',

  mining: {
    sessionHours: Number(process.env.EXPO_PUBLIC_MINING_SESSION_HOURS) || 6,
    hashrate: 0.048,
    unlockThreshold: 10000,
  },

  node: {
    pollIntervalMs: 30000,
    maxTemperature: 85,
    sessionTimeoutMs: 21600000,
  },

  staking: {
    platformFee: 0.1,
    minStake: 10,
    products: [
      { id: 'flexible', name: 'Flexible Staking', apy: 8.5, lockDays: 0, minAmount: 10, maxAmount: 10000, penalty: 0, color: '#6C5CE7' },
      { id: '30day', name: '30-Day Lock', apy: 12, lockDays: 30, minAmount: 50, maxAmount: 50000, penalty: 0.05, color: '#00CEC9' },
      { id: '90day', name: '90-Day Lock', apy: 18, lockDays: 90, minAmount: 100, maxAmount: 100000, penalty: 0.1, color: '#FDCB6E' },
      { id: '180day', name: '180-Day Lock', apy: 25, lockDays: 180, minAmount: 500, maxAmount: 500000, penalty: 0.15, color: '#E17055' },
    ],
  },

  kyc: {
    miningDaysRequired: Number(process.env.EXPO_PUBLIC_KYC_MINING_DAYS_REQUIRED) || 10,
  },

  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
};

export const NODE_TIERS = [
  { name: 'Bronze' as const, minASH: 0, hashrate: 0.048, dailyReward: 1.152, hourlyRate: 0.048, color: '#CD7F32' },
  { name: 'Silver' as const, minASH: 100, hashrate: 0.096, dailyReward: 2.304, hourlyRate: 0.096, color: '#C0C0C0' },
  { name: 'Gold' as const, minASH: 500, hashrate: 0.24, dailyReward: 5.76, hourlyRate: 0.24, color: '#FFD700' },
];

export const syndicateConfig = {
  tiers: NODE_TIERS,
};

export const links = {
  privacy: 'https://ashcoin.app/privacy',
  terms: 'https://ashcoin.app/terms',
  support: 'https://ashcoin.app/support',
};
