// functions/src/index.ts
/**
 * Firebase Cloud Functions — ASH Protocol Balance Management
 * 
 * ALL balance changes MUST go through these functions.
 * Client-side direct balance writes are blocked by Firestore Security Rules.
 * 
 * Owner: dominikus.02@gmail.com
 * 
 * Balance Type Handling:
 * - Mining app uses `double` (floating point)
 * - Staking app uses `int64` (integer)
 * - Firestore stores as `double`
 * - Conversion: double × 1,000,000 = int64 (6 decimal precision)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// ============================================
// CONSTANTS
// ============================================
const OWNER_EMAIL = 'dominikus.02@gmail.com';
const DECIMALS = 1_000_000;

// ============================================
// OWNER VERIFICATION
// ============================================
async function verifyOwner(context: functions.https.CallableContext): Promise<string> {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const user = await admin.auth().getUser(context.auth.uid);
  if (user.email !== OWNER_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', 'Only owner can perform this action');
  }
  return context.auth.uid;
}

// ============================================
// BALANCE TYPE NORMALIZATION
// ============================================
function normalizeBalance(value: unknown): number {
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value > DECIMALS) {
      return value / DECIMALS;
    }
    return value;
  }
  if (typeof value === 'bigint') {
    return Number(value) / DECIMALS;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isInteger(parsed) && parsed > DECIMALS) {
      return parsed / DECIMALS;
    }
    return parsed;
  }
  return 0;
}

// ============================================
// MINING REWARDS
// ============================================
exports.completeMiningSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const uid = context.auth.uid;

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new functions.https.HttpsError('not-found', 'User not found');

  const userData = userSnap.data()!;
  if (!userData.mining?.isActive) {
    throw new functions.https.HttpsError('failed-precondition', 'No active mining session');
  }

  const startTime = userData.mining.startTime;
  const now = Date.now();
  const elapsedSec = Math.min((now - startTime) / 1000, 21600);
  const hashrate = 0.048;
  const earned = elapsedSec * (hashrate / 3600);
  const balance = normalizeBalance(userData.balance);
  const newBalance = balance + earned;

  await db.runTransaction(async (t) => {
    const freshSnap = await t.get(userRef);
    const freshData = freshSnap.data()!;
    
    const currentAshBalance = normalizeBalance(freshData.ASHBalance);
    const newAshBalance = currentAshBalance + earned;

    t.update(userRef, {
      balance: newBalance,
      ASHBalance: newAshBalance,
      'wallets.funding': newAshBalance,
      'mining.isActive': false,
      'mining.startTime': null,
      'mining.lastSync': now,
      stakingUnlocked: newBalance >= 10000,
    });

    t.create(userRef.collection('transactions').doc(), {
      type: 'mining_reward',
      amount: earned,
      description: `Mining Reward - ${earned.toFixed(6)} ASH earned`,
      balanceAfter: newBalance,
      createdAt: now,
    });
  });

  return { success: true, earned, newBalance };
});

// ============================================
// DAILY BONUS
// ============================================
exports.claimDailyBonus = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const uid = context.auth.uid;

  const userRef = db.collection('users').doc(uid);
  
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const data = snap.data()!;
    const today = new Date().toDateString();
    
    if (new Date(data.lastDailyClaim || 0).toDateString() === today) {
      throw new functions.https.HttpsError('failed-precondition', 'Already claimed today');
    }

    const bonus = 0.005;
    const balance = normalizeBalance(data.balance);
    const newBalance = balance + bonus;

    const ashBalance = normalizeBalance(data.ASHBalance);

    const newAshBalance = ashBalance + bonus;

    t.update(userRef, {
      balance: newBalance,
      ASHBalance: newAshBalance,
      'wallets.funding': newAshBalance,
      lastDailyClaim: Date.now(),
      stakingUnlocked: newBalance >= 10000,
    });

    t.create(userRef.collection('transactions').doc(), {
      type: 'daily_bonus',
      amount: bonus,
      description: 'Daily Bonus',
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });
  });

  return { success: true };
});

// ============================================
// P2P TRANSFER
// ============================================
exports.transferAsh = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const senderUid = context.auth.uid;
  const { recipientUid, amount } = data;

  if (!recipientUid || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid transfer parameters');
  }

  const GAS_FEE = 0.001;
  const totalCost = amount + GAS_FEE;

  await db.runTransaction(async (t) => {
    const senderSnap = await t.get(db.collection('users').doc(senderUid));
    const senderData = senderSnap.data()!;
    const senderBalance = normalizeBalance(senderData.balance);
    
    if (senderBalance < totalCost) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
    }

    const recipientSnap = await t.get(db.collection('users').doc(recipientUid));
    if (!recipientSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found');
    }
    const recipientData = recipientSnap.data()!;
    const recipientBalance = normalizeBalance(recipientData.balance);

    const senderNewBalance = senderBalance - totalCost;
    const recipientNewBalance = recipientBalance + amount;

    t.update(db.collection('users').doc(senderUid), {
      balance: senderNewBalance,
    });

    t.update(db.collection('users').doc(recipientUid), {
      balance: recipientNewBalance,
    });

    t.create(
      db.collection('users').doc(senderUid).collection('transactions').doc(),
      {
        type: 'transfer_sent',
        amount: -amount,
        fee: GAS_FEE,
        description: `Sent ${amount.toFixed(6)} ASH`,
        balanceAfter: senderNewBalance,
        recipientUid,
        createdAt: Date.now(),
      }
    );

    t.create(
      db.collection('users').doc(recipientUid).collection('transactions').doc(),
      {
        type: 'transfer_received',
        amount,
        fee: 0,
        description: `Received ${amount.toFixed(6)} ASH`,
        balanceAfter: recipientNewBalance,
        senderUid,
        createdAt: Date.now(),
      }
    );
  });

  return { success: true };
});

// ============================================
// TRANSFER TO STAKING (balance → ASHBalance)
// ============================================
exports.transferToStaking = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const uid = context.auth.uid;
  const { amount } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
  }

  const UNLOCK_THRESHOLD = 10000;
  const TRANSFER_PCT = 0.01;

  await db.runTransaction(async (t) => {
    const snap = await t.get(db.collection('users').doc(uid));
    const userData = snap.data()!;
    const balance = normalizeBalance(userData.balance);
    const ashBalance = normalizeBalance(userData.ASHBalance);

    if (balance < UNLOCK_THRESHOLD) {
      throw new functions.https.HttpsError('failed-precondition', 'Need 10,000 ASH to unlock staking');
    }

    const maxTransfer = balance * TRANSFER_PCT;
    if (amount > maxTransfer) {
      throw new functions.https.HttpsError('failed-precondition', `Max transfer is ${maxTransfer.toFixed(6)} ASH (1% of balance)`);
    }

    const newBalance = balance - amount;
    const newAshBalance = ashBalance + amount;
    const wallets = userData.wallets || { funding: 0, trading: 0 };
    const newFunding = normalizeBalance(wallets.funding) + amount;

    t.update(db.collection('users').doc(uid), {
      balance: newBalance,
      ASHBalance: newAshBalance,
      stakingUnlocked: true,
      'wallets.funding': newFunding,
    });

    t.create(
      db.collection('users').doc(uid).collection('transactions').doc(),
      {
        type: 'transfer_to_staking',
        amount: -amount,
        description: `Transferred ${amount.toFixed(6)} ASH to Staking`,
        balanceAfter: newBalance,
        createdAt: Date.now(),
      }
    );
  });

  return { success: true };
});

// ============================================
// TRANSFER FROM STAKING (ASHBalance → balance)
// ============================================
exports.transferFromStaking = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  const uid = context.auth.uid;
  const { amount } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
  }

  await db.runTransaction(async (t) => {
    const snap = await t.get(db.collection('users').doc(uid));
    const userData = snap.data()!;
    const ashBalance = normalizeBalance(userData.ASHBalance);
    const balance = normalizeBalance(userData.balance);

    if (amount > ashBalance) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient staking balance');
    }

    const newAshBalance = ashBalance - amount;
    const newBalance = balance + amount;

    t.update(db.collection('users').doc(uid), {
      balance: newBalance,
      ASHBalance: newAshBalance,
      'wallets.funding': newAshBalance,
    });

    t.create(
      db.collection('users').doc(uid).collection('transactions').doc(),
      {
        type: 'transfer_from_staking',
        amount,
        description: `Withdrawn ${amount.toFixed(6)} ASH from Staking`,
        balanceAfter: newBalance,
        createdAt: Date.now(),
      }
    );
  });

  return { success: true };
});

// ============================================
// OWNER: MANUAL BALANCE EDIT
// ============================================
exports.ownerEditBalance = functions.https.onCall(async (data, context) => {
  const ownerUid = await verifyOwner(context);
  const { targetUid, newBalance, reason } = data;

  if (!targetUid || newBalance === undefined || newBalance < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const userRef = db.collection('users').doc(targetUid);
  const snap = await userRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'User not found');

  const oldBalance = normalizeBalance(snap.data()!.balance);

  await db.runTransaction(async (t) => {
    t.update(userRef, { balance: newBalance });

    t.create(
      userRef.collection('balanceAudit').doc(),
      {
        type: 'owner_edit',
        oldBalance,
        newBalance,
        reason,
        editedBy: ownerUid,
        createdAt: Date.now(),
      }
    );
  });

  functions.logger.info(`Owner ${ownerUid} edited ${targetUid} balance: ${oldBalance} → ${newBalance}. Reason: ${reason}`);
  return { success: true, oldBalance, newBalance };
});

// ============================================
// OWNER: MANUAL ASH BALANCE EDIT
// ============================================
exports.ownerEditAshBalance = functions.https.onCall(async (data, context) => {
  const ownerUid = await verifyOwner(context);
  const { targetUid, newAshBalance, reason } = data;

  if (!targetUid || newAshBalance === undefined || newAshBalance < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const userRef = db.collection('users').doc(targetUid);
  const snap = await userRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'User not found');

  const oldAshBalance = normalizeBalance(snap.data()!.ASHBalance);

  await db.runTransaction(async (t) => {
    t.update(userRef, { ASHBalance: newAshBalance, 'wallets.funding': newAshBalance });

    t.create(
      userRef.collection('ashBalanceAudit').doc(),
      {
        type: 'owner_edit_ash',
        oldBalance: oldAshBalance,
        newBalance: newAshBalance,
        reason,
        editedBy: ownerUid,
        createdAt: Date.now(),
      }
    );
  });

  functions.logger.info(`Owner ${ownerUid} edited ${targetUid} ASHBalance: ${oldAshBalance} → ${newAshBalance}. Reason: ${reason}`);
  return { success: true, oldBalance: oldAshBalance, newBalance: newAshBalance };
});
