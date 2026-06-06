// ============================================================
// NaNaGi Agent 工具 — generate_image
// 腾讯混元 hy-image-v3.0 → SSE action:jukebox
// 重构自 route.ts hunyuan_generate_image case
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";
import { generateImage as hunyuanGenerate } from "@/lib/hunyuan";

registerTool({
  definition: {
    name: "generate_image",
    description:
      "使用主人的 AI 模型生成图片。当客人要求'画一张''生成图片''帮我做一张图'或想展示某个水果/物体时调用。生成后图片会自动显示，CNN 模型会接着识别它。",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description:
            "图片生成提示词，支持中文和英文。描述要画什么（例: '一个新鲜的红苹果'）",
        },
      },
      required: ["prompt"],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    const prompt = args.prompt as string;

    try {
      const imageUrl = await hunyuanGenerate(prompt, 120_000); // 2 分钟超时

      // SSE action:jukebox → 前端显示图片
      ctx._emit?.({
        type: "action",
        action: "jukebox",
        payload: {
          status: "show_image",
          mode: "classify",
          imageUrl,
        },
      });

      return {
        tool_call_id: "",
        content:
          `混元生图完成，提示词: "${prompt}"。图片已展示。` +
          `请告诉客人"请看～这就是客人要的图片！主人的 CNN 模型即将开始识别..."`,
      };
    } catch (err) {
      // 恢复唱片机到 idle
      ctx._emit?.({
        type: "action",
        action: "jukebox",
        payload: { status: "idle", mode: "classify" },
      });

      const errMsg = err instanceof Error ? err.message : "未知错误";
      return {
        tool_call_id: "",
        content:
          `⚠️ 混元生图失败: ${errMsg}。请用女仆口吻告知客人: ` +
          `"抱歉呢，主人的生图服务暂时有点小麻烦～可能是免费的 API 额度用完了，要不试试换个描述词？"`,
        is_error: true,
      };
    }
  },
});
