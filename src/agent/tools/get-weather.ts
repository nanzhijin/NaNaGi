// ============================================================
// NaNaGi Agent 工具 — get_weather
// 和风天气 API — 用户显式询问天气时调用
// 自动环境数据已在 System Prompt [0] 中注入 (不经过此工具)
// ============================================================

import { registerTool } from "../registry";
import type { ToolResult } from "../types";
import { getWeatherConfig } from "@/lib/env";

registerTool({
  definition: {
    name: "get_weather",
    description:
      "查询指定城市的实时天气。当用户询问天气、气温、是否下雨、出门建议时调用。如果不指定城市，自动使用用户当前所在城市。",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description:
            "城市名称，支持中文（'杭州'）或英文（'Hangzhou'）。不填则自动使用用户所在城市",
        },
      },
      required: [],
    },
  },

  async execute(args, ctx): Promise<ToolResult> {
    // 确定城市 → 坐标
    const city = (args.city as string) || ctx.ambient?.location?.city || null;
    const coords = ctx.ambient?.location?.coordinates;

    const { apiKey, apiHost } = getWeatherConfig();
    if (!apiKey) {
      return {
        tool_call_id: "",
        content:
          "天气服务暂未配置呢～请主人设置 WEATHER_API_KEY 环境变量后就可以使用了。",
      };
    }

    if (!city || !coords) {
      return {
        tool_call_id: "",
        content: "抱歉呢，无法确定您的城市～请告诉我您在哪个城市，我帮您查天气。",
      };
    }

    // 如果城市跟 ambient 里的城市相同 + 缓存有效 → 用缓存
    // 否则独立查询
    try {
      const cacheCoords = coords.lat.toFixed(2) + "," + coords.lng.toFixed(2);
      const url = `${apiHost}?location=${coords.lng.toFixed(2)},${coords.lat.toFixed(2)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        headers: { "X-QW-Api-Key": apiKey },
      });
      if (!res.ok) {
        return {
          tool_call_id: "",
          content: `天气查询失败 (HTTP ${res.status})，请稍后再试～`,
          is_error: true,
        };
      }

      const json = await res.json();
      const now = json.now;
      if (!now) {
        return {
          tool_call_id: "",
          content: "天气数据暂时不可用，请稍后再试～",
          is_error: true,
        };
      }

      return {
        tool_call_id: "",
        content:
          `${city}天气: ${now.text}, ${now.temp}°C, ` +
          `湿度 ${now.humidity}%, 体感 ${now.feelsLike}°C, 风速 ${now.windSpeed}km/h。`,
      };
    } catch {
      return {
        tool_call_id: "",
        content: "天气服务连接失败，请稍后重试～",
        is_error: true,
      };
    }
  },
});
