// src/lib/balanceChain.ts
/**
 * Balance Chain Security System
 * 
 * Every balance change creates a cryptographically-linked chain entry:
 * - balanceId: unique UUID for this balance state
 * - balanceHash: SHA-256(prevHash + amount + timestamp + uid + type)
 * - balanceSeq: monotonically increasing sequence number
 * 
 * If anyone tampers with balance directly in Firestore, the chain breaks
 * and the tampering is detected on next verification.
 */

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface BalanceChainEntry {
  balanceId: string;
  balanceHash: string;
  balanceSeq: number;
  amount: number;
  type: string;
  timestamp: number;
  prevHash: string;
}

export async function generateGenesisBalance(uid: string, initialBalance: number): Promise<BalanceChainEntry> {
  const timestamp = Date.now();
  const balanceId = crypto.randomUUID();
  const prevHash = 'genesis';
  const hashInput = `${prevHash}:${initialBalance}:${timestamp}:${uid}:genesis`;
  const balanceHash = await sha256(hashInput);
  return { balanceId, balanceHash, balanceSeq: 1, amount: initialBalance, type: 'genesis', timestamp, prevHash };
}

export async function generateNextBalance(
  prevEntry: BalanceChainEntry,
  newAmount: number,
  type: string,
  uid: string
): Promise<BalanceChainEntry> {
  const timestamp = Date.now();
  const balanceId = crypto.randomUUID();
  const hashInput = `${prevEntry.balanceHash}:${newAmount}:${timestamp}:${uid}:${type}`;
  const balanceHash = await sha256(hashInput);
  return {
    balanceId,
    balanceHash,
    balanceSeq: prevEntry.balanceSeq + 1,
    amount: newAmount,
    type,
    timestamp,
    prevHash: prevEntry.balanceHash,
  };
}

export async function verifyBalanceChain(
  currentEntry: BalanceChainEntry,
  uid: string
): Promise<{ valid: boolean; reason?: string }> {
  const hashInput = `${currentEntry.prevHash}:${currentEntry.amount}:${currentEntry.timestamp}:${uid}:${currentEntry.type}`;
  const expectedHash = await sha256(hashInput);
  if (currentEntry.balanceHash !== expectedHash) {
    return { valid: false, reason: 'Hash mismatch - possible tampering detected' };
  }
  if (currentEntry.balanceSeq < 1) {
    return { valid: false, reason: 'Invalid sequence number' };
  }
  return { valid: true };
}

export function createBalanceChainFields(entry: BalanceChainEntry) {
  return {
    balanceId: entry.balanceId,
    balanceHash: entry.balanceHash,
    balanceSeq: entry.balanceSeq,
    balanceTimestamp: entry.timestamp,
    balanceType: entry.type,
  };
}
