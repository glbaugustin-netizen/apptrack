import { NextRequest, NextResponse } from "next/server";

const COOKIE = "apptrack_token";
const SECRET = process.env.JWT_SECRET ?? "apptrack-dev-secret-change-in-production";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

// Web Crypto JWT verification — compatible with Edge Runtime (no Node.js APIs needed)
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Base64url → Uint8Array
    const b64ToBytes = (b64: string) => {
      const std = b64.replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(std);
      return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    };

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64ToBytes(signatureB64),
      encoder.encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64ToBytes(payloadB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const userId = token ? await getUserIdFromToken(token) : null;

  if (pathname.startsWith("/api/")) {
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.next();
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
