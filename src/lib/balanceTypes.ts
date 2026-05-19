// src/lib/balanceTypes.ts
/**
 * Balance Type Conversion Utility
 * 
 * Problem: Mining app uses `double`, Staking app uses `int64`.
 * 
 * Solution: 
 * - Firestore stores everything as `double` (native number type)
 * - Staking app converts `double` → `int64` internally (multiply by DECIMALS)
 * - When staking app writes back, converts `int64` → `double` (divide by DECIMALS)
 * 
 * DECIMALS = 1_000_000 (6 decimal precision, same as Bitcoin satoshis approach)
 * 
 * Examples:
 *   2.048 ASH → 2_048_000 (int64)
 *   0.000001 ASH → 1 (int64, smallest unit)
 *   10_000 ASH → 10_000_000_000 (int64, well within int64 max of 9.22e18)
 */

export const DECIMALS = 1_000_000;
export const DECIMALS_BIGINT = BigInt(1_000_000);

/**
 * Convert double (Firestore) → int64 (staking app internal)
 * 
 * @param doubleValue Balance as double (e.g., 2.048)
 * @returns BigInt representing int64 value (e.g., 2048000n)
 */
export function doubleToInt64(doubleValue: number): bigint {
  if (!Number.isFinite(doubleValue)) {
    throw new Error(`Invalid double value: ${doubleValue}`);
  }
  if (doubleValue < 0) {
    throw new Error(`Balance cannot be negative: ${doubleValue}`);
  }
  if (doubleValue > 9_223_372_036_854_775_807 / DECIMALS) {
    throw new Error(`Value exceeds int64 max: ${doubleValue}`);
  }
  return BigInt(Math.round(doubleValue * DECIMALS));
}

/**
 * Convert int64 (staking app internal) → double (Firestore)
 * 
 * @param int64Value Balance as int64 BigInt (e.g., 2048000n)
 * @returns Number representing double value (e.g., 2.048)
 */
export function int64ToDouble(int64Value: bigint): number {
  if (int64Value < 0n) {
    throw new Error(`int64 value cannot be negative: ${int64Value}`);
  }
  const maxInt64 = 9_223_372_036_854_775_807n;
  if (int64Value > maxInt64) {
    throw new Error(`int64 value exceeds max: ${int64Value}`);
  }
  return Number(int64Value) / DECIMALS;
}

/**
 * Validate that a double value can be safely converted to int64 without precision loss
 * 
 * @param doubleValue Balance as double
 * @returns true if safe, false if precision would be lost
 */
export function isSafeDoubleToDouble(doubleValue: number): boolean {
  if (!Number.isFinite(doubleValue)) return false;
  if (doubleValue < 0) return false;
  const converted = int64ToDouble(doubleToInt64(doubleValue));
  return Math.abs(converted - doubleValue) < 1e-12;
}

/**
 * Format balance for display with proper decimal places
 * 
 * @param value Balance (double or int64)
 * @param isInt64 Whether the value is int64
 * @returns Formatted string (e.g., "2.048000")
 */
export function formatBalance(value: number | bigint, isInt64 = false): string {
  const doubleValue = isInt64 ? int64ToDouble(value as bigint) : (value as number);
  return doubleValue.toFixed(6);
}

/**
 * Parse user input into a safe double value
 * 
 * @param input User input string (e.g., "2.048")
 * @returns Parsed double value
 */
export function parseBalanceInput(input: string): number {
  const parsed = parseFloat(input);
  if (!Number.isFinite(parsed)) throw new Error('Invalid balance input');
  if (parsed < 0) throw new Error('Balance cannot be negative');
  return Math.round(parsed * DECIMALS) / DECIMALS; // Round to 6 decimals
}

/**
 * Check if two balances are equal (handling floating point precision)
 * 
 * @param a First balance
 * @param b Second balance
 * @param tolerance Maximum allowed difference (default: 1e-12)
 */
export function balancesEqual(a: number, b: number, tolerance = 1e-12): boolean {
  return Math.abs(a - b) < tolerance;
}

/**
 * Safe addition of two double balances
 * Converts to int64, adds, converts back to avoid floating point errors
 */
export function safeAdd(a: number, b: number): number {
  const sum = doubleToInt64(a) + doubleToInt64(b);
  return int64ToDouble(sum);
}

/**
 * Safe subtraction of two double balances
 * Returns null if result would be negative
 */
export function safeSubtract(a: number, b: number): number | null {
  const diff = doubleToInt64(a) - doubleToInt64(b);
  if (diff < 0n) return null;
  return int64ToDouble(diff);
}

/**
 * Migration helper: check if existing Firestore data needs type correction
 */
export function needsMigration(data: { balance?: unknown; ASHBalance?: unknown }): { balance: boolean; ashBalance: boolean } {
  const balanceNeeds = typeof data.balance === 'number' && !Number.isInteger(data.balance * DECIMALS);
  const ashNeeds = typeof data.ASHBalance === 'number' && !Number.isInteger(data.ASHBalance * DECIMALS);
  return { balance: balanceNeeds, ashBalance: ashNeeds };
}
