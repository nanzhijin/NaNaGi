// ============================================================
// NaNaGi Cell API — P4
// GET:  列出当前用户的所有 Cell
// POST: 创建新 Cell
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, verifyToken } from "@/lib/auth";
import { listCells, putCell } from "@/lib/store";
import type { CellRecord } from "@/lib/leveldb";
import { nanoid } from "nanoid";

async function getAuth(request: NextRequest) {
  const token = await getAuthCookie();
  if (!token) return null;
  const jwt = await verifyToken(token);
  return jwt.valid ? jwt : null;
}

export async function GET(request: NextRequest) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const cells = await listCells(auth.personId);
    // 按最后消息时间倒序, 不返回完整 messages (列表用)
    const brief = cells
      .sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""))
      .map(({ cellId, title, pinned, createdAt, lastMessageAt, messageCount, personId }) => ({
        cellId, title, pinned, createdAt, lastMessageAt, messageCount, personId,
      }));
    return NextResponse.json(brief);
  } catch (err) {
    console.error("[Cells] GET error:", err);
    return NextResponse.json({ error: "读取 Cell 列表失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const cellId = `cell-${nanoid(8)}`;
    const now = new Date().toISOString();

    const record: CellRecord = {
      cellId,
      personId: auth.personId,
      title: body.title || "新对话",
      createdAt: now,
      lastMessageAt: now,
      messageCount: 0,
      messages: [],
    };

    await putCell(record);

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[Cells] POST error:", err);
    return NextResponse.json({ error: "创建 Cell 失败" }, { status: 500 });
  }
}
