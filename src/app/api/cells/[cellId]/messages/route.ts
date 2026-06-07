// ============================================================
// NaNaGi Cell Messages API — P4
// GET: 获取 Cell 的完整消息历史
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, verifyToken } from "@/lib/auth";
import { getCell, putCell } from "@/lib/store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cellId: string }> }
) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const jwt = await verifyToken(token);
  if (!jwt.valid) return NextResponse.json({ error: "Token过期" }, { status: 401 });

  try {
    const { cellId } = await params;
    const cell = await getCell(jwt.personId, cellId);

    if (!cell) {
      return NextResponse.json({ messages: [] });
    }

    // 转换消息格式 (assistant → agent)
    const messages = (cell.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));

    return NextResponse.json({ messages, title: cell.title });
  } catch (err) {
    console.error("[CellMessages] GET error:", err);
    return NextResponse.json({ error: "读取消息失败" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cellId: string }> }
) {
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const jwt = await verifyToken(token);
  if (!jwt.valid) return NextResponse.json({ error: "Token过期" }, { status: 401 });

  try {
    const { cellId } = await params;
    const body = await request.json();
    const { messages } = body as { messages: { id: string; role: string; content: string }[] };

    const cell = await getCell(jwt.personId, cellId);
    if (!cell) return NextResponse.json({ error: "Cell不存在" }, { status: 404 });

    // ID 去重: 跳过已存在的消息 ID
    const existingIds = new Set(cell.messages.map((m) => m.id));
    const newMsgs = messages
      .filter((m) => m.id && !existingIds.has(m.id))
      .map((m) => ({ ...m, timestamp: new Date().toISOString() }));

    if (newMsgs.length > 0) {
      cell.messages.push(...newMsgs);
      cell.messageCount = cell.messages.length;
      cell.lastMessageAt = new Date().toISOString();
      await putCell(cell);
    }

    return NextResponse.json({ success: true, added: newMsgs.length });
  } catch (err) {
    console.error("[CellMessages] PUT error:", err);
    return NextResponse.json({ error: "保存消息失败" }, { status: 500 });
  }
}
