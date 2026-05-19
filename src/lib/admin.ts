// src/lib/admin.ts
/**
 * Admin-only balance management.
 * Only the project owner (dominikus.02@gmail.com) can manually edit balances.
 * 
 * All balance edits are logged to balanceAudit with type 'owner_edit'.
 */

import { doc, getDoc, updateDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { generateNextBalance, createBalanceChainFields, type BalanceChainEntry } from './balanceChain';

const OWNER_EMAIL = 'dominikus.02@gmail.com';

export async function getOwnerUid(): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'admin', 'config'));
    if (snap.exists()) {
      return snap.data().ownerUid || null;
    }
  } catch (e) {
    console.error('[ADMIN] Failed to get owner UID:', e);
  }
  return null;
}

export interface OwnerBalanceEdit {
  uid: string;
  oldBalance: number;
  newBalance: number;
  reason: string;
  editedBy: string;
  timestamp: number;
}

/**
 * Owner-only: manually edit a user's balance.
 * This is the ONLY way to directly change balance outside of automated mining/transfer logic.
 */
export async function ownerEditBalance(
  editorUid: string,
  targetUid: string,
  newBalance: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (newBalance < 0) return { success: false, error: 'Balance cannot be negative' };

  try {
    const userSnap = await getDoc(doc(db, 'users', targetUid));
    if (!userSnap.exists()) return { success: false, error: 'User not found' };

    const userData = userSnap.data();
    const oldBalance = userData.balance || 0;

    const prevChain: BalanceChainEntry = {
      balanceId: userData.balanceId,
      balanceHash: userData.balanceHash,
      balanceSeq: userData.balanceSeq,
      amount: userData.balance,
      type: userData.balanceType,
      timestamp: userData.balanceTimestamp,
      prevHash: 'genesis',
    };

    const chainEntry = await generateNextBalance(prevChain, newBalance, 'owner_edit', targetUid);

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', targetUid), {
      balance: newBalance,
      ...createBalanceChainFields(chainEntry),
    });

    const auditRef = doc(collection(db, 'users', targetUid, 'balanceAudit'));
    batch.set(auditRef, {
      ...chainEntry,
      uid: targetUid,
      createdAt: chainEntry.timestamp,
      editedBy: editorUid,
      reason,
    });

    await batch.commit();

    console.log(`[ADMIN] Owner edited ${targetUid} balance: ${oldBalance} → ${newBalance}. Reason: ${reason}`);
    return { success: true };
  } catch (err) {
    console.error('[ADMIN] Owner edit balance failed:', err);
    return { success: false, error: 'Failed to edit balance' };
  }
}

/**
 * Owner-only: manually edit a user's ASHBalance (staking).
 */
export async function ownerEditAshBalance(
  editorUid: string,
  targetUid: string,
  newAshBalance: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (newAshBalance < 0) return { success: false, error: 'ASHBalance cannot be negative' };

  try {
    const userSnap = await getDoc(doc(db, 'users', targetUid));
    if (!userSnap.exists()) return { success: false, error: 'User not found' };

    const userData = userSnap.data();
    const oldAshBalance = userData.ASHBalance || 0;

    const prevChain: BalanceChainEntry = {
      balanceId: userData.ashBalanceId,
      balanceHash: userData.ashBalanceHash,
      balanceSeq: userData.ashBalanceSeq,
      amount: userData.ASHBalance,
      type: userData.ashBalanceType,
      timestamp: userData.ashBalanceTimestamp,
      prevHash: 'genesis',
    };

    const chainEntry = await generateNextBalance(prevChain, newAshBalance, 'owner_edit_ash', targetUid);

    const batch = writeBatch(db);
    batch.update(doc(db, 'users', targetUid), {
      ASHBalance: newAshBalance,
      ashBalanceId: chainEntry.balanceId,
      ashBalanceHash: chainEntry.balanceHash,
      ashBalanceSeq: chainEntry.balanceSeq,
      ashBalanceTimestamp: chainEntry.timestamp,
      ashBalanceType: chainEntry.type,
    });

    const auditRef = doc(collection(db, 'users', targetUid, 'ashBalanceAudit'));
    batch.set(auditRef, {
      ...chainEntry,
      uid: targetUid,
      createdAt: chainEntry.timestamp,
      editedBy: editorUid,
      reason,
    });

    await batch.commit();

    console.log(`[ADMIN] Owner edited ${targetUid} ASHBalance: ${oldAshBalance} → ${newAshBalance}. Reason: ${reason}`);
    return { success: true };
  } catch (err) {
    console.error('[ADMIN] Owner edit ASHBalance failed:', err);
    return { success: false, error: 'Failed to edit ASHBalance' };
  }
}
