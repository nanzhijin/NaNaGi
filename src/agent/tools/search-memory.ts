// ============================================================
// NaNaGi Agent 工具 — search_memory
// 文件系统搜索显性记忆 (RAG 前过渡版, P2 升级为 LanceDB 语义检索)
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";
import { listMemories } from "@/lib/memory";

registerTool({
  definition: {
    name: "search_memory",
    description:
      "搜索主人/客人的历史记忆。当需要了解客人的偏好、背景、过往对话时调用。当前使用关键词匹配，找到相关记忆后返回。",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "搜索查询，用自然语言描述想找什么。例如 '客人之前提到过什么技术栈' '主人有什么偏好'",
        },
        top_k: {
          type: "number",
          description: "返回最相关的几条记忆，默认 5",
        },
      },
      required: ["query"],
    },
  },

  async execute(args): Promise<ToolResult> {
    const query = (args.query as string).toLowerCase();
    const topK = (args.top_k as number) || 5;

    try {
      const all = await listMemories();
      if (all.length === 0) {
        return { tool_call_id: "", content: "目前还没有任何记忆呢～" };
      }

      // 简单关键词匹配 (P2 替换为 embedding + LanceDB)
      const scored = all
        .map((m) => {
          const text = (m.meta.description + " " + m.content).toLowerCase();
          const queryTerms = query.split(/\s+/);
          const score = queryTerms.filter((t) => text.includes(t)).length;
          return { ...m, score };
        })
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      if (scored.length === 0) {
        return {
          tool_call_id: "",
          content: `没有找到与 "${args.query}" 相关的记忆。`,
        };
      }

      const formatted = scored
        .map(
          (m) =>
            `- **${m.meta.description}** (${m.meta.type})\n  ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`
        )
        .join("\n\n");

      return {
        tool_call_id: "",
        content: `找到 ${scored.length} 条相关记忆:\n\n${formatted}`,
      };
    } catch (err) {
      return {
        tool_call_id: "",
        content: `记忆搜索失败: ${err instanceof Error ? err.message : String(err)}`,
        is_error: true,
      };
    }
  },
});
