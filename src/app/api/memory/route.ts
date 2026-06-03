import { NextResponse } from "next/server";
import { listMemories, createMemory } from "@/lib/memory";
import type { MemoryMeta } from "@/lib/memory";

export async function GET() {
  try {
    const memories = await listMemories();
    // 不返回完整 content，只给元数据（列表用）
    const brief = memories.map(({ slug, meta, updatedAt }) => ({
      slug,
      meta,
      updatedAt,
    }));
    return NextResponse.json(brief);
  } catch (err) {
    console.error("[Memory] GET error:", err);
    return NextResponse.json({ error: "读取记忆失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { meta, content } = body as { meta: MemoryMeta; content: string };
    if (!meta?.name || !meta?.description || !content) {
      return NextResponse.json({ error: "缺少必要字段 (name, description, content)" }, { status: 400 });
    }
    const entry = await createMemory(meta, content);
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[Memory] POST error:", err);
    return NextResponse.json({ error: "创建记忆失败" }, { status: 500 });
  }
}
