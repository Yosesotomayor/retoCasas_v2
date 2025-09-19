import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail } from "./auth-db";

// Simple auth options without database adapter for RSC pages
export const simpleAuthOptions: AuthOptions = {
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
    strategy: "jwt", // Use JWT for RSC compatibility
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // Always get fresh user data from database for every request
      if (token.id) {
        const userData = await getUserByEmail(token.email as string);
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