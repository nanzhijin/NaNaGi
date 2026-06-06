// ============================================================
// NaNaGi Agent 工具 — gnn_recommend_friends
// GNN 社交图谱推荐 (当前占位, 等 FastAPI 推理服务就绪)
// 重构自 route.ts gnn_recommend_friends case
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";

const MOCK_FRIENDS = [
  { name: "用户A（运动爱好者）", score: 0.94 },
  { name: "用户B（健身达人）", score: 0.89 },
  { name: "用户C（球鞋收藏家）", score: 0.82 },
];

registerTool({
  definition: {
    name: "gnn_recommend_friends",
    description:
      "调用主人的 GNN 社交图谱模型，根据用户画像推荐潜在好友。在 GNN 项目展厅中使用。",
    input_schema: {
      type: "object",
      properties: {
        user_profile: {
          type: "string",
          description:
            "模拟用户画像描述（例: '喜欢运动品牌的年轻用户'）",
        },
      },
      required: ["user_profile"],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    const userProfile = args.user_profile as string;

    // TODO: 调用本地 GNN FastAPI 推理服务
    // POST http://localhost:8001/gnn/recommend
    console.log("[GNN] 推荐请求:", userProfile);

    const friends = MOCK_FRIENDS;

    // SSE model_result → 前端显示推荐结果
    ctx._emit?.({
      type: "model_result",
      model: "gnn",
      result: {
        model: "gnn",
        topLabel: friends[0]?.name || "N/A",
        confidence: friends[0]?.score || 0,
        allPredictions: friends.map((f) => ({
          label: f.name,
          probability: f.score,
        })),
      },
    });

    return {
      tool_call_id: "",
      content:
        `GNN 推荐完成。用户画像: "${userProfile}"。` +
        `Top-3: ${friends.map((f) => `${f.name}(${(f.score * 100).toFixed(0)}%)`).join(", ")}。` +
        `请用女仆口吻解读推荐结果的合理性。`,
    };
  },
});
