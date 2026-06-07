// ============================================================
// NaNaGi Cell 个体操作 API — P4
// PATCH: 重命名 Cell
// DELETE: 删除 Cell
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, verifyToken } from "@/lib/auth";
import { getCell, putCell } from "@/lib/store";
import fs from "fs/promises";
import path from "path";

async function getAuth(request: NextRequest) {
  const token = await getAuthCookie();
  if (!token) return null;
  const jwt = await verifyToken(token);
  return jwt.valid ? jwt : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cellId: string }> }
) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { cellId } = await params;
    const body = await request.json();
    const cell = await getCell(auth.personId, cellId);
    if (!cell) return NextResponse.json({ error: "Cell不存在" }, { status: 404 });

    if (body.title !== undefined) cell.title = body.title;
    if (body.pinned !== undefined) cell.pinned = body.pinned;
    await putCell(cell);

    return NextResponse.json({ success: true, title: cell.title });
  } catch (err) {
    console.error("[Cell] PATCH error:", err);
    return NextResponse.json({ error: "重命名失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cellId: string }> }
) {
  const auth = await getAuth(request);
  if (!auth) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const { cellId } = await params;
    const cellDir = path.join(process.cwd(), "data", "leveldb", auth.personId, "cells");
    const cellFile = path.join(cellDir, `${cellId}.json`);
    const idxFile = path.join(cellDir, "_index.json");

    // 删 Cell 文件
    try { await fs.unlink(cellFile); } catch { /* ignore */ }

    // 更新索引
    try {
      const raw = await fs.readFile(idxFile, "utf-8");
      const idx: string[] = JSON.parse(raw);
      const updated = idx.filter((id) => id !== cellId);
      await fs.writeFile(idxFile, JSON.stringify(updated), "utf-8");
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Cell] DELETE error:", err);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
