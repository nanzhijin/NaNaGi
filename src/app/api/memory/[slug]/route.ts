import { NextResponse } from "next/server";
import { getMemory, deleteMemory } from "@/lib/memory";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const entry = await getMemory(slug);
    if (!entry) {
      return NextResponse.json({ error: "记忆未找到" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (err) {
    console.error("[Memory] GET slug error:", err);
    return NextResponse.json({ error: "读取记忆失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ok = await deleteMemory(slug);
    if (!ok) {
      return NextResponse.json({ error: "记忆未找到" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Memory] DELETE error:", err);
    return NextResponse.json({ error: "删除记忆失败" }, { status: 500 });
  }
}
