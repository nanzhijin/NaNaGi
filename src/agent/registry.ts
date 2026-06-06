// ============================================================
// NaNaGi Agent 工具注册表 — P1-3
// 工具和 Agent Loop 之间的解耦层
// Loop 不关心有哪些工具 — 只需要 know "有一堆工具, 每个有 name+description+execute"
// ============================================================

import type { ToolDefinition, ToolCall, ToolResult } from "./types";
import type { AgentContext } from "./types";

// —— 工具条目 ——

interface ToolEntry {
  definition: ToolDefinition;
  execute: (
    args: Record<string, unknown>,
    ctx: AgentContext
  ) => Promise<ToolResult>;
}

const registry = new Map<string, ToolEntry>();

// —— 公开 API ——

/** 注册一个工具 */
export function registerTool(entry: ToolEntry): void {
  if (registry.has(entry.definition.name)) {
    console.warn(`[ToolRegistry] 覆盖已注册的工具: ${entry.definition.name}`);
  }
  registry.set(entry.definition.name, entry);
}

/** 获取所有工具定义 — 直接塞进 LLM 的 tools 参数 */
export function listToolDefinitions(): ToolDefinition[] {
  return Array.from(registry.values()).map((e) => e.definition);
}

/** 获取单个工具 */
export function getTool(name: string): ToolEntry | undefined {
  return registry.get(name);
}

/** 批量并行执行工具 — 一个工具失败不影响其他 */
export async function executeTools(
  calls: ToolCall[],
  ctx: AgentContext
): Promise<ToolResult[]> {
  return Promise.all(
    calls.map(async (call) => {
      const tool = getTool(call.name);
      if (!tool) {
        return {
          tool_call_id: call.id,
          content: `工具 "${call.name}" 不存在。可用的工具: ${Array.from(registry.keys()).join(", ")}`,
          is_error: true,
        };
      }
      try {
        const result = await tool.execute(call.arguments, ctx);
        // 注入 tool_call_id (工具不需要自己填)
        result.tool_call_id = call.id;
        return result;
      } catch (err) {
        return {
          tool_call_id: call.id,
          content: `工具 "${call.name}" 执行异常: ${err instanceof Error ? err.message : String(err)}`,
          is_error: true,
        };
      }
    })
  );
}
