// ============================================================
// NaNaGi 记忆系统 — 复刻 Claude Code 文件记忆架构
// /data/memory/MEMORY.md 索引 + *.md 记忆文件
// ============================================================

import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MEMORY_DIR = process.env.MEMORY_DIR || path.join(process.cwd(), "data", "memory");
const INDEX_FILE = "MEMORY.md";

// ==================== 类型 ====================

export type MemoryType = "user" | "project" | "impression" | "feedback";

export interface MemoryMeta {
  name: string;           // slug
  description: string;    // 一行摘要
  type: MemoryType;
  tags?: string[];
  visitorId?: string;
  projectSlug?: string;
  createdAt?: string;
}

export interface MemoryEntry {
  slug: string;
  meta: MemoryMeta;
  content: string;
  updatedAt: string;
}

// ==================== 解析 ====================

function parseFrontmatter(raw: string): { meta: MemoryMeta; content: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const yaml = match[1];
  const content = match[2].trim();
  const meta: Record<string, unknown> = {};

  for (const line of yaml.split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) {
      const key = m[1];
      let val: unknown = m[2].trim();
      if (key === "tags" && typeof val === "string") {
        val = val.replace(/^\[|\]$/g, "").split(",").map(s => s.trim()).filter(Boolean);
      }
      meta[key] = val;
    }
  }

  return {
    meta: meta as unknown as MemoryMeta,
    content,
  };
}

function buildFrontmatter(meta: MemoryMeta): string {
  const lines = [
    "---",
    `name: ${meta.name}`,
    `description: ${meta.description}`,
    `type: ${meta.type}`,
  ];
  if (meta.tags?.length) lines.push(`tags: [${meta.tags.join(", ")}]`);
  if (meta.visitorId) lines.push(`visitorId: ${meta.visitorId}`);
  if (meta.projectSlug) lines.push(`projectSlug: ${meta.projectSlug}`);
  if (meta.createdAt) lines.push(`createdAt: ${meta.createdAt}`);
  lines.push("---");
  return lines.join("\n");
}

// ==================== 文件操作 ====================

async function ensureDir(): Promise<string> {
  if (!existsSync(MEMORY_DIR)) {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  }
  return MEMORY_DIR;
}

async function readIndexSlugs(): Promise<string[]> {
  await ensureDir();
  const indexPath = path.join(MEMORY_DIR, INDEX_FILE);
  if (!existsSync(indexPath)) return [];

  const raw = await fs.readFile(indexPath, "utf-8");
  const slugs: string[] = [];
  const re = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    slugs.push(m[2].replace(/\.md$/, ""));
  }
  return slugs;
}

async function writeIndexFile(entries: MemoryEntry[]): Promise<void> {
  await ensureDir();
  const labels: Record<string, string> = {
    user: "👤 访客档案",
    project: "📁 项目记忆",
    impression: "💭 NaNaGi 印象笔记",
    feedback: "📝 反馈记录",
  };

  const groups: Record<string, MemoryEntry[]> = {};
  for (const e of entries) {
    (groups[e.meta.type] ??= []).push(e);
  }

  const lines = [
    "# NaNaGi 记忆索引",
    "",
    `> 最后更新: ${new Date().toISOString()}`,
    "",
  ];

  for (const [type, items] of Object.entries(groups)) {
    lines.push(`## ${labels[type] || type}`, "");
    for (const item of items) {
      lines.push(`- [${item.meta.description}](${item.slug}.md) — \`${item.meta.name}\``);
    }
    lines.push("");
  }

  await fs.writeFile(path.join(MEMORY_DIR, INDEX_FILE), lines.join("\n"), "utf-8");
}

// ==================== 公开 API ====================

export async function listMemories(): Promise<MemoryEntry[]> {
  await ensureDir();
  const slugs = await readIndexSlugs();
  const entries: MemoryEntry[] = [];

  for (const slug of slugs) {
    const fp = path.join(MEMORY_DIR, `${slug}.md`);
    if (!existsSync(fp)) continue;
    const stat = await fs.stat(fp);
    const raw = await fs.readFile(fp, "utf-8");
    const parsed = parseFrontmatter(raw);
    if (parsed) {
      entries.push({
        slug,
        meta: parsed.meta,
        content: parsed.content,
        updatedAt: stat.mtime.toISOString(),
      });
    }
  }

  entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return entries;
}

export async function getMemory(slug: string): Promise<MemoryEntry | null> {
  await ensureDir();
  const fp = path.join(MEMORY_DIR, `${slug}.md`);
  if (!existsSync(fp)) return null;
  const stat = await fs.stat(fp);
  const raw = await fs.readFile(fp, "utf-8");
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  return { slug, meta: parsed.meta, content: parsed.content, updatedAt: stat.mtime.toISOString() };
}

export async function createMemory(meta: MemoryMeta, content: string): Promise<MemoryEntry> {
  await ensureDir();
  const slug = meta.name || slugify(meta.description);
  meta.createdAt = meta.createdAt || new Date().toISOString();

  const fm = buildFrontmatter(meta);
  const fp = path.join(MEMORY_DIR, `${slug}.md`);
  await fs.writeFile(fp, `${fm}\n\n${content.trim()}\n`, "utf-8");

  const entry: MemoryEntry = {
    slug,
    meta,
    content: content.trim(),
    updatedAt: new Date().toISOString(),
  };

  // 更新索引
  const all = await listMemories();
  const updated = all.some(e => e.slug === slug)
    ? all.map(e => e.slug === slug ? entry : e)
    : [...all, entry];
  await writeIndexFile(updated);

  return entry;
}

export async function deleteMemory(slug: string): Promise<boolean> {
  await ensureDir();
  const fp = path.join(MEMORY_DIR, `${slug}.md`);
  if (!existsSync(fp)) return false;
  await fs.unlink(fp);
  const remaining = (await listMemories()).filter(e => e.slug !== slug);
  await writeIndexFile(remaining);
  return true;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}
