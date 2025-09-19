import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// In-memory storage for users and sessions
interface InMemoryUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM';
  subscriptionStatus: 'ACTIVE' | 'CANCELED';
  stripeCustomerId?: string;
  createdAt: Date;
}

interface InMemorySession {
  sessionToken: string;
  userId: string;
  expires: Date;
}

// Storage - Use globalThis to persist across Next.js hot reloads
declare global {
  var __users: Map<string, InMemoryUser> | undefined;
  var __sessions: Map<string, InMemorySession> | undefined;
}

export const users = globalThis.__users ?? new Map<string, InMemoryUser>();
const sessions = globalThis.__sessions ?? new Map<string, InMemorySession>();

// Persist to globalThis
globalThis.__users = users;
globalThis.__sessions = sessions;

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function createUser(userData: Omit<InMemoryUser, 'id' | 'createdAt'>): InMemoryUser {
  const user: InMemoryUser = {
    id: generateId(),
    ...userData,
    createdAt: new Date(),
  };
  users.set(user.id, user);
  return user;
}

export function getUserByEmail(email: string): InMemoryUser | undefined {
  return Array.from(users.values()).find(user => user.email === email);
}

export function getUserById(id: string): InMemoryUser | undefined {
  return users.get(id);
}

export function createSession(userId: string): InMemorySession {
  const session: InMemorySession = {
    sessionToken: generateId(),
    userId,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };
  sessions.set(session.sessionToken, session);
  return session;
}

export function getSessionByToken(token: string): InMemorySession | undefined {
  const session = sessions.get(token);
  if (session && session.expires > new Date()) {
    return session;
  }
  if (session) {
    sessions.delete(token); // Clean up expired session
  }
  return undefined;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function updateUserStripeCustomerId(userId: string, stripeCustomerId: string): void {
  const user = users.get(userId);
  if (user) {
    user.stripeCustomerId = stripeCustomerId;
  }
}

export function updateUserSubscription(userId: string, subscriptionType: 'FREE' | 'BASIC' | 'PREMIUM', status: 'ACTIVE' | 'CANCELED' = 'ACTIVE'): void {
  const user = users.get(userId);
  if (user) {
    user.subscriptionType = subscriptionType;
    user.subscriptionStatus = status;
  }
}

export function getUserByStripeCustomerId(stripeCustomerId: string): InMemoryUser | undefined {
  return Array.from(users.values()).find(user => user.stripeCustomerId === stripeCustomerId);
}

// Auth options
export const authOptions: AuthOptions = {
  providers: [
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
        let existingUser = getUserByEmail(user.email);

        if (!existingUser) {
          existingUser = createUser({
            email: user.email,
            name: user.name || undefined,
            image: user.image || undefined,
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

      // Always get fresh user data from our in-memory store for every request
      if (token.id) {
        const userData = getUserById(token.id as string);
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

export default NextAuth(authOptions);