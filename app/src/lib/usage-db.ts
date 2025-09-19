import { getDb } from './db';
import { usageRecords } from './db/schema';
import { eq, and } from 'drizzle-orm';

// Define subscription limits
export const SUBSCRIPTION_LIMITS = {
  FREE: 3,
  BASIC: 20,
  PREMIUM: 50,
} as const;

export interface UsageInfo {
  canUse: boolean;
  limit: number;
  used: number;
  remaining: number;
  subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM';
  resetDate: Date;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get usage for a specific user and date
export async function getDailyUsage(userId: string, date?: string) {
  const targetDate = date || getCurrentDate();
  const db = await getDb();

  const result = await db
    .select()
    .from(usageRecords)
    .where(and(
      eq(usageRecords.userId, userId),
      eq(usageRecords.date, targetDate)
    ))
    .limit(1);

  return result[0] || null;
}

// Record a query for a user
export async function recordQuery(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<void> {
  const date = getCurrentDate();
  const db = await getDb();

  const existing = await getDailyUsage(userId, date);

  if (existing) {
    // Update existing record
    await db
      .update(usageRecords)
      .set({
        queryCount: existing.queryCount + 1,
        updatedAt: new Date()
      })
      .where(eq(usageRecords.id, existing.id));
  } else {
    // Create new record
    await db
      .insert(usageRecords)
      .values({
        userId,
        date,
        queryCount: 1,
        subscriptionType,
      });
  }
}

// Get usage limits based on subscription type
export function getUsageLimit(subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): number {
  return SUBSCRIPTION_LIMITS[subscriptionType];
}

// Check if user has reached their daily limit
export async function hasReachedLimit(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<boolean> {
  const usage = await getDailyUsage(userId);
  const limit = getUsageLimit(subscriptionType);

  if (!usage) return false;

  return usage.queryCount >= limit;
}

// Get usage summary for a user
export async function getUsageSummary(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM') {
  const today = getCurrentDate();
  const usage = await getDailyUsage(userId, today);
  const limit = getUsageLimit(subscriptionType);
  const used = usage?.queryCount || 0;
  const remaining = Math.max(0, limit - used);

  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 1);
  resetDate.setHours(0, 0, 0, 0);

  return {
    date: today,
    queryCount: used,
    subscriptionType,
    canUse: remaining > 0,
    limit,
    used,
    remaining,
    resetDate,
  };
}

// Check usage limit (async)
export async function checkUsageLimit(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<UsageInfo> {
  const summary = await getUsageSummary(userId, subscriptionType);

  return {
    canUse: summary.canUse,
    limit: summary.limit,
    used: summary.used,
    remaining: summary.remaining,
    subscriptionType: summary.subscriptionType,
    resetDate: summary.resetDate,
  };
}

// Increment usage
export async function incrementUsage(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<void> {
  await recordQuery(userId, subscriptionType);
}

// Get usage history
export async function getUsageHistory(userId: string, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  const db = await getDb();

  const results = await db
    .select()
    .from(usageRecords)
    .where(eq(usageRecords.userId, userId))
    .orderBy(usageRecords.date);

  return results.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}