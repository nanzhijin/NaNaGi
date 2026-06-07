// ============================================================
// NaNaGi K-V 存储引擎 — P2-2
// 文件系统 K-V (Turbopack不兼容classic-level原生模块)
// 接口可替换: 未来换真实LevelDB只需改此文件
// 六表命名空间: user / iwm / mem / emo / conv / feedback
// ============================================================

import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// ==================== 初始化 ====================

const DB_DIR = path.join(process.cwd(), "data", "leveldb");

async function ensureDir(): Promise<void> {
  if (!existsSync(DB_DIR)) {
    await fs.mkdir(DB_DIR, { recursive: true });
  }
}

/** 生成合法的文件名 key */
function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_:.-]/g, "_");
}

function keyPath(key: string): string {
  return path.join(DB_DIR, safeKey(key) + ".json");
}

// ==================== 通用 CRUD ====================

export async function dbPut(key: string, value: Record<string, unknown>): Promise<void> {
  await ensureDir();
  await fs.writeFile(keyPath(key), JSON.stringify(value), "utf-8");
}

export async function dbGet<T = Record<string, unknown>>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(keyPath(key), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function dbDelete(key: string): Promise<void> {
  try {
    await fs.unlink(keyPath(key));
  } catch {
    // 文件不存在 → 忽略
  }
}

/** 按前缀扫描 */
export async function dbScan<T = Record<string, unknown>>(
  prefix: string,
  cb: (key: string, value: T) => void | Promise<void>
): Promise<void> {
  await ensureDir();
  const files = await fs.readdir(DB_DIR);
  const safePfx = safeKey(prefix);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const rawKey = file.replace(/\.json$/, "");

    // 逆向 safeKey 做前缀匹配 (近似)
    if (!rawKey.startsWith(safePfx)) continue;

    try {
      const raw = await fs.readFile(path.join(DB_DIR, file), "utf-8");
      const value = JSON.parse(raw) as T;
      await cb(rawKey, value);
    } catch {
      // 损坏文件跳过
    }
  }
}

/** 按前缀获取所有值列表 */
export async function dbList<T = Record<string, unknown>>(prefix: string): Promise<T[]> {
  const results: T[] = [];
  await dbScan<T>(prefix, (_, value) => {
    results.push(value);
  });
  return results;
}

// ==================== Key 命名空间 ====================

const NS = {
  user: (personId: string) => `user:${personId}`,
  iwm: (personId: string) => `iwm:${personId}`,
  mem: (personId: string, ts: string) => `mem:${personId}:${ts}`,
  emo: (personId: string, ts: string) => `emo:${personId}:${ts}`,
  conv: (personId: string, cellId: string) => `conv:${personId}:${cellId}`,
  convCells: (personId: string) => `conv:${personId}:cells`,
  convLastSummary: (personId: string) => `conv:${personId}:last-summary`,
  feedback: (personId: string) => `feedback:${personId}`,
} as const;

// ==================== 用户 — Table 1 ====================

export interface UserRecord {
  personId: string;
  name: string;
  passwordHash: string;
  role: "guest-iv" | "guest";
  identity: "面试官" | "普通用户";
  company?: string;
  jobRole?: string;
  techInterests?: string[];
  wantToKnow?: string[];
  createdAt: string;
  lastLogin: string;
}

export async function putUserRecord(record: UserRecord): Promise<void> {
  await dbPut(NS.user(record.personId), record as unknown as Record<string, unknown>);
}

export async function getUserRecord(personId: string): Promise<UserRecord | null> {
  return dbGet<UserRecord>(NS.user(personId));
}

// ==================== IWM Node — Table 2 ====================

export interface IWMNode {
  personId: string;
  name: string;
  role: "admin" | "guest-iv" | "guest";
  identity: string;
  traits: {
    safety: number; intimacy: number; care: number;
    respect: number; reliability: number; understanding: number;
  };
  knownFacts: string[];
  topicInterests: string[];
  company?: string;
  jobRole?: string;
  firstMet: string;
  lastTalk: string;
  totalTurns: number;
  historyDensity: number;
}

export async function putIWMNode(node: IWMNode): Promise<void> {
  await dbPut(NS.iwm(node.personId), node as unknown as Record<string, unknown>);
}

export async function getIWMNode(personId: string): Promise<IWMNode | null> {
  return dbGet<IWMNode>(NS.iwm(personId));
}

// ==================== 记忆 — Table 3 ====================

export interface MemoryRecord {
  slug: string;
  personId: string;
  meta: {
    name: string;
    description: string;
    type: "user" | "project" | "impression" | "feedback";
    tags: string[];
    createdAt: string;
  };
  content: string;
  summary: string;
  keywords: string[];
}

export async function putMemoryRecord(record: MemoryRecord): Promise<void> {
  const ts = record.meta.createdAt || new Date().toISOString();
  await dbPut(NS.mem(record.personId, ts), record as unknown as Record<string, unknown>);
}

export async function listMemoryRecords(personId: string): Promise<MemoryRecord[]> {
  return dbList<MemoryRecord>(NS.mem(personId, ""));
}

// ==================== 情绪轨迹 — Table 4 ====================

export interface EmotionEntry {
  timestamp: string;
  personId: string;
  roundNumber: number;
  before: Record<string, number>;
  delta: Record<string, number>;
  trigger: { type: string; summary: string };
  ambientMood: Record<string, number>;
}

export async function putEmotionEntry(entry: EmotionEntry): Promise<void> {
  await dbPut(NS.emo(entry.personId, entry.timestamp), entry as unknown as Record<string, unknown>);
}

// ==================== Cell 会话 — Table 5 ====================

export interface CellRecord {
  cellId: string;
  personId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  messages: { id: string; role: string; content: string; timestamp: string }[];
  toolCallsUsed?: string[];
  summary?: string;
}

export async function putCellRecord(record: CellRecord): Promise<void> {
  await dbPut(NS.conv(record.personId, record.cellId), record as unknown as Record<string, unknown>);
  // 维护 cell 列表索引
  const cells = await dbGet<string[]>(NS.convCells(record.personId)) || [];
  if (!cells.includes(record.cellId)) {
    cells.push(record.cellId);
    await dbPut(NS.convCells(record.personId), cells as unknown as Record<string, unknown>);
  }
}

export async function getCellRecord(personId: string, cellId: string): Promise<CellRecord | null> {
  return dbGet<CellRecord>(NS.conv(personId, cellId));
}

export async function listCellRecords(personId: string): Promise<CellRecord[]> {
  const cellIds = await dbGet<string[]>(NS.convCells(personId)) || [];
  const cells: CellRecord[] = [];
  for (const cid of cellIds) {
    const cell = await dbGet<CellRecord>(NS.conv(personId, cid));
    if (cell) cells.push(cell);
  }
  return cells;
}

export async function putLastSummary(personId: string, summary: string): Promise<void> {
  await dbPut(NS.convLastSummary(personId), { summary } as unknown as Record<string, unknown>);
}

export async function getLastSummary(personId: string): Promise<string | null> {
  const data = await dbGet<{ summary: string }>(NS.convLastSummary(personId));
  return data?.summary || null;
}

// ==================== 面试反馈 — Table 6 ====================

export interface FeedbackRecord {
  personId: string;
  name: string;
  records: {
    timestamp: string;
    sessionId: string;
    cellId: string;
    company: string;
    role: string;
    impression: string;
    projectInterest: string[];
    quotes: string[];
  }[];
  summary: string;
}

export async function putFeedbackRecord(record: FeedbackRecord): Promise<void> {
  await dbPut(NS.feedback(record.personId), record as unknown as Record<string, unknown>);
}

export async function getFeedbackRecord(personId: string): Promise<FeedbackRecord | null> {
  return dbGet<FeedbackRecord>(NS.feedback(personId));
}

// ==================== 全局查询 ====================

/** 按角色和最近活跃时间筛选用户 */
export async function listGuestNodesByActivity(
  daysBack: number,
  identity?: string
): Promise<{ personId: string; name: string; identity: string; lastTalk: string; totalTurns: number }[]> {
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const results: { personId: string; name: string; identity: string; lastTalk: string; totalTurns: number }[] = [];

  await dbScan<IWMNode>("iwm:", (key, node) => {
    if (node.role === "admin") return;
    if (identity && node.identity !== identity) return;
    if (new Date(node.lastTalk).getTime() < cutoff) return;
    results.push({
      personId: node.personId,
      name: node.name,
      identity: node.identity,
      lastTalk: node.lastTalk,
      totalTurns: node.totalTurns,
    });
  });

  results.sort((a, b) => new Date(b.lastTalk).getTime() - new Date(a.lastTalk).getTime());
  return results;
}
