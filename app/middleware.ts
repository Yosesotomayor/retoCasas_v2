// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function makeNonce() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const nonce = makeNonce();

  res.headers.set("x-nonce", nonce);

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' blob:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://* wss://*",
    "font-src 'self' data:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = { matcher: "/:path*" };