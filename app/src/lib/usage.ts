// In-memory usage tracking
interface UsageRecord {
  userId: string;
  date: string; // YYYY-MM-DD format
  queryCount: number;
  subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM';
}

// Storage
const dailyUsage = new Map<string, UsageRecord>();

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

// Helper to generate key
function getUsageKey(userId: string, date: string): string {
  return `${userId}-${date}`;
}

// Get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get usage for a specific user and date
export function getDailyUsage(userId: string, date?: string): UsageRecord | null {
  const targetDate = date || getCurrentDate();
  const key = getUsageKey(userId, targetDate);
  return dailyUsage.get(key) || null;
}

// Record a query for a user
export function recordQuery(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): void {
  const date = getCurrentDate();
  const key = getUsageKey(userId, date);

  const existing = dailyUsage.get(key);
  if (existing) {
    existing.queryCount += 1;
  } else {
    dailyUsage.set(key, {
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
export function hasReachedLimit(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): boolean {
  const usage = getDailyUsage(userId);
  const limit = getUsageLimit(subscriptionType);

  if (!usage) return false;

  return usage.queryCount >= limit;
}

// Get usage summary for a user
export function getUsageSummary(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM') {
  const today = getCurrentDate();
  const usage = getDailyUsage(userId, today);
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

// Check usage limit (async for compatibility)
export async function checkUsageLimit(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<UsageInfo> {
  const summary = getUsageSummary(userId, subscriptionType);

  return {
    canUse: summary.canUse,
    limit: summary.limit,
    used: summary.used,
    remaining: summary.remaining,
    subscriptionType: summary.subscriptionType,
    resetDate: summary.resetDate,
  };
}

// Increment usage (async for compatibility)
export async function incrementUsage(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM'): Promise<void> {
  recordQuery(userId, subscriptionType);
}

// Get usage history
export async function getUsageHistory(userId: string, days = 30) {
  const results: UsageRecord[] = [];
  const endDate = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const usage = getDailyUsage(userId, dateStr);
    if (usage) {
      results.push(usage);
    }
  }

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}