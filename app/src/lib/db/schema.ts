import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { randomUUID } from 'crypto';

// Enums for better type safety
export const subscriptionTypeEnum = pgEnum('subscription_type', ['FREE', 'BASIC', 'PREMIUM']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['ACTIVE', 'CANCELED']);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'), // For manual registration
  subscriptionType: subscriptionTypeEnum('subscription_type').notNull().default('FREE'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('ACTIVE'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


// Usage records table
export const usageRecords = pgTable('usage_records', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD format
  queryCount: integer('query_count').notNull().default(0),
  subscriptionType: subscriptionTypeEnum('subscription_type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// House predictions table
export const housePredictions = pgTable('house_predictions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  price: text('price').notNull(), // Store as string to preserve precision
  properties: text('properties').notNull(), // JSON string of house properties
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;


export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;

export type HousePrediction = typeof housePredictions.$inferSelect;
export type NewHousePrediction = typeof housePredictions.$inferInsert;