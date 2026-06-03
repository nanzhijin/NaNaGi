import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export type UserRole = "guest" | "admin";

const SECRET = new TextEncoder().encode(
  process.env.NANAGI_PASSWORD_HASH || "fallback-secret-change-me"
);
const COOKIE_NAME = "nanagi_token";
const EXPIRES_IN = "1h";

// ==================== 密码验证 ====================

const GUEST_HASH = process.env.NANAGI_PASSWORD_HASH || "";
const ADMIN_HASH = process.env.NANAGI_ADMIN_PASSWORD_HASH || "";

export function verifyPassword(password: string): { valid: boolean; role: UserRole } {
  // 先试管理员密码
  if (ADMIN_HASH && bcrypt.compareSync(password, ADMIN_HASH)) {
    return { valid: true, role: "admin" };
  }
  // 再试面试官密码
  if (GUEST_HASH && bcrypt.compareSync(password, GUEST_HASH)) {
    return { valid: true, role: "guest" };
  }
  return { valid: false, role: "guest" };
}

// ==================== JWT ====================

export async function createToken(role: UserRole): Promise<string> {
  return new SignJWT({ sub: "nanagi_user", role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ valid: boolean; role: UserRole }> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      valid: true,
      role: (payload.role as UserRole) || "guest",
    };
  } catch {
    return { valid: false, role: "guest" };
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}
