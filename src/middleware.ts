import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NANAGI_PASSWORD_HASH || "fallback-secret-change-me"
);
const COOKIE_NAME = "nanagi_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护 /api/chat 和 /api/memory 写操作
  if (pathname.startsWith("/api/chat") || pathname.startsWith("/api/memory")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "未登录，请输入密码" }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = (payload.role as string) || "guest";

      // 删除记忆：仅 admin
      if (request.method === "DELETE" && pathname.startsWith("/api/memory") && role !== "admin") {
        return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
      }

      // 创建记忆：仅 Agent 调用（内部），不需要额外限制
      // 但所有操作需要有效的 JWT

      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "登录已过期，请重新输入密码" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/chat/:path*", "/api/memory/:path*"],
};
