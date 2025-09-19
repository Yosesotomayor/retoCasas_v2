import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-db";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };