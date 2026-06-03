import { NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie, verifyPassword, verifyToken, getAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { password } = body;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "请输入密码" }, { status: 400 });
  }

  const result = verifyPassword(password);
  if (!result.valid) {
    return NextResponse.json({ error: "密码错误，请重试" }, { status: 401 });
  }

  const token = await createToken(result.role);
  await setAuthCookie(token);

  return NextResponse.json({
    success: true,
    role: result.role,
  });
}

export async function GET() {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ authenticated: false, role: null });
  }
  const { valid, role } = await verifyToken(token);
  return NextResponse.json({ authenticated: valid, role: valid ? role : null });
}
