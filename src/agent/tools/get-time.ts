// ============================================================
// NaNaGi Agent 工具 — get_time
// 本地 Date, 零外部依赖, 不可能失败
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";

registerTool({
  definition: {
    name: "get_time",
    description:
      "获取当前日期和时间。当用户询问'现在几点''今天几号''当前时间'时调用。",
    input_schema: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "IANA 时区名，如 'Asia/Shanghai'。不填默认根据用户 IP 自动判断",
        },
      },
      required: [],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    const tz =
      (args.timezone as string) ||
      ctx.ambient?.location?.timezone ||
      "Asia/Shanghai";

    const now = new Date();
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    const formatted = now.toLocaleString("zh-CN", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const content = `${formatted} (${tz}) — ${weekDays[now.getDay()]}曜日`;

    return { tool_call_id: "", content };
  },
});
