// ============================================================
// NaNaGi Agent 工具 — navigate_to_project
// SSE action:navigate → 前端跳转项目展厅
// 重构自 route.ts navigate_to_project case
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";

const PROJECT_NAMES: Record<string, string> = {
  "fruit-cnn": "水果识别 CNN",
  "cnn-music": "CnnMusic 多模态召回",
  gnn: "GNN 链接预测",
};

registerTool({
  definition: {
    name: "navigate_to_project",
    description:
      "引导客人进入项目互动展厅。客人表示想了解某个项目、想看 demo、或对项目表现出兴趣时调用。",
    input_schema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          enum: ["fruit-cnn", "cnn-music", "gnn"],
          description: "项目标识",
        },
      },
      required: ["project"],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    const project = args.project as string;
    const name = PROJECT_NAMES[project] || project;
    const href = `/projects/${project}`;

    // SSE action:navigate → 前端 router.push
    ctx._emit?.({
      type: "action",
      action: "navigate",
      payload: { href, text: `查看${name}` },
    });

    return {
      tool_call_id: "",
      content:
        `已引导客人进入「${name}」展厅。` +
        `请用女仆口吻告诉客人"请跟我来～"，并简要介绍在这个展厅里可以做什么。`,
    };
  },
});
