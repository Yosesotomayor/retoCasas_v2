import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Helper functions
export async function createUser(userData: {
  email: string;
  name?: string;
  passwordHash?: string;
  subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'CANCELED';
  stripeCustomerId?: string;
}) {
  const db = await getDb();
  const result = await db
    .insert(users)
    .values(userData)
    .returning();

  return result[0];
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}

export async function getUserById(id: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] || null;
}


export async function updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
  const db = await getDb();
  await db
    .update(users)
    .set({
      stripeCustomerId,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function updateUserSubscription(
  userId: string,
  subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM',
  status: 'ACTIVE' | 'CANCELED' = 'ACTIVE'
): Promise<void> {
  const db = await getDb();
  await db
    .update(users)
    .set({
      subscriptionType,
      subscriptionStatus: status,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return result[0] || null;
}

// Auth options
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from database
          const user = await getUserByEmail(credentials.email);

          if (!user) {
            return null;
          }

          // For Google OAuth users, passwordHash will be null
          if (!user.passwordHash) {
            return null; // This user was created via OAuth, can't login with credentials
          }

          // Verify password
          const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Check if user exists, if not create them
        let existingUser = await getUserByEmail(user.email);

        if (!existingUser) {
          existingUser = await createUser({
            email: user.email,
            name: user.name || undefined,
            subscriptionType: 'FREE',
            subscriptionStatus: 'ACTIVE',
          });
        }

        // Update user ID to match our internal ID
        user.id = existingUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // Always get fresh user data from database for every request
      if (token.id) {
        const userData = await getUserById(token.id as string);
        if (userData) {
          token.subscriptionType = userData.subscriptionType;
          token.subscriptionStatus = userData.subscriptionStatus;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).subscription = {
          type: token.subscriptionType || 'FREE',
          status: token.subscriptionStatus || 'ACTIVE',
          currentPeriodEnd: null
        };
      }
      return session;
    },
  },
};

// Registration function for credentials-based registration
export async function registerUser(email: string, password: string, name: string) {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create new user with hashed password
  const user = await createUser({
    email,
    name,
    passwordHash,
    subscriptionType: 'FREE',
    subscriptionStatus: 'ACTIVE',
  });

  return user;
}

export default NextAuth(authOptions);