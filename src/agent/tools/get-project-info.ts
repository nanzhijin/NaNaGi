// ============================================================
// NaNaGi Agent 工具 — get_project_info
// 读取项目元数据 → 结构化返回
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";
import { projects } from "@/lib/projects";

registerTool({
  definition: {
    name: "get_project_info",
    description:
      "获取主人的项目信息。当客人询问'南志锦做了什么项目''介绍一下GNN''你会什么'时调用。返回项目的技术栈、指标、亮点，供 NaNaGi 用自然语言转述。",
    input_schema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          enum: ["gnn", "cnn-music", "fruit-cnn"],
          description: "项目标识: gnn (社交图谱链接预测) / cnn-music (多模态音频召回) / fruit-cnn (水果识别CNN)",
        },
      },
      required: [],
    },
  },

  async execute(args): Promise<ToolResult> {
    const slug = args.project as string | undefined;

    if (slug && projects[slug]) {
      const p = projects[slug];
      const metrics = p.metrics?.map((m) => `${m.label}: ${m.value}`).join(" / ") || "";
      const tech = p.tech?.join(", ") || "";

      return {
        tool_call_id: "",
        content:
          `**${p.emoji} ${p.title}**\n${p.description}\n\n` +
          `技术栈: ${tech}\n` +
          (metrics ? `核心指标: ${metrics}\n` : "") +
          ("highlights" in p ? `亮点:\n${(p as Record<string,unknown>).highlights}\n` : ""),
      };
    }

    // 无参数 → 列出所有项目
    const list = Object.entries(projects)
      .map(([key, p]) => {
        const metrics = p.metrics?.map((m) => `${m.label}: ${m.value}`).join(" / ") || "";
        return `**${p.emoji} ${p.title}** (${key})\n${p.description}\n${metrics}`;
      })
      .join("\n\n");

    return {
      tool_call_id: "",
      content: `主人有 ${Object.keys(projects).length} 个核心项目:\n\n${list}`,
    };
  },
});
