// ============================================================
// NaNaGi Agent 工具 — cnnmusic_search
// CnnMusic 多模态召回 (当前占位, 等 FastAPI 检索服务就绪)
// 重构自 route.ts cnnmusic_search case
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";

const MOCK_TRACKS = [
  { title: "Jazz Cafe Vol.3", genre: "Jazz", similarity: 0.96 },
  { title: "Late Night Blues", genre: "Blues", similarity: 0.91 },
  { title: "Smooth Bossa", genre: "Bossa Nova", similarity: 0.87 },
];

registerTool({
  definition: {
    name: "cnnmusic_search",
    description:
      "调用主人的 CnnMusic 多模态召回模型，根据音乐风格检索匹配的音乐/播客。在 CnnMusic 项目展厅中使用。",
    input_schema: {
      type: "object",
      properties: {
        style: {
          type: "string",
          description:
            "音乐风格或描述（例: '爵士'、'古典钢琴'、'电子氛围'）",
        },
      },
      required: ["style"],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    const style = args.style as string;

    // TODO: 调用本地 CnnMusic FastAPI 检索服务
    // POST http://localhost:8001/cnnmusic/search
    console.log("[CnnMusic] 检索请求:", style);

    const tracks = MOCK_TRACKS;

    // SSE model_result → 前端显示检索结果
    ctx._emit?.({
      type: "model_result",
      model: "cnn-music",
      result: {
        model: "cnn-music",
        topLabel: tracks[0]?.title || "N/A",
        confidence: tracks[0]?.similarity || 0,
        allPredictions: tracks.map((t) => ({
          label: t.title,
          probability: t.similarity,
        })),
      },
    });

    return {
      tool_call_id: "",
      content:
        `CnnMusic 检索完成。音乐风格: "${style}"。` +
        `Top-3: ${tracks.map((t) => `${t.title}(${(t.similarity * 100).toFixed(0)}%)`).join(", ")}。` +
        `请用女仆口吻解读: "客人，主人的 CnnMusic 模型为您找到了这些音乐～"`,
    };
  },
});
