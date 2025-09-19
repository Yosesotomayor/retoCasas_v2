import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection string for development (localhost) vs production (docker service name)
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, use localhost instead of 'db' service name
    return process.env.DATABASE_URL?.replace('db:5432', 'localhost:5432') ||
           'postgresql://admin:awdrqwer12@localhost:5432/db';
  }
  return process.env.DATABASE_URL || 'postgresql://admin:awdrqwer12@db:5432/db';
};

let db: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<void> | null = null;

async function initializeDb() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('🔄 Running database migrations...');

      // Run migrations first
      const connectionString = getDatabaseUrl();
      const migrationClient = postgres(connectionString, { max: 1 });
      const migrationDb = drizzle(migrationClient);

      await migrate(migrationDb, {
        migrationsFolder: './drizzle'
      });

      await migrationClient.end();

      // Initialize main database connection
      const queryClient = postgres(connectionString);
      db = drizzle(queryClient, { schema });

      console.log('✅ Database initialized with migrations completed');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  })();

  return initPromise;
}

export async function getDb() {
  if (!db) {
    await initializeDb();
  }
  return db!;
}