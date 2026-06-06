// ============================================================
// NaNaGi Agent System Prompt 引擎 — P1-5
// buildSystemPrompt(ctx) → 七段式动态拼接
// 同一个函数, guest/admin 传不同 config → 不同输出
// ============================================================

import type { AgentContext } from "./types";
import { listToolDefinitions } from "./registry";

// ==================== 环境感知段落 [0] ====================

function buildAmbientSection(ctx: AgentContext): string {
  const a = ctx.ambient;
  if (!a) return "";

  const lines: string[] = [];
  const t = a.time;

  // 时间
  const timeLabels: Record<string, string> = {
    dawn: "黎明", morning: "早晨", forenoon: "上午", afternoon: "下午",
    evening: "傍晚", night: "夜晚", midnight: "深夜",
  };
  const seasonLabels: Record<string, string> = {
    spring: "春", summer: "夏", autumn: "秋", winter: "冬",
  };

  lines.push(`现在是${seasonLabels[t.season]}季，${timeLabels[t.timeOfDay]}。`);
  if (t.isHoliday) lines.push("今天是节假日。");

  // 地点 + 天气
  if (a.weather && a.location) {
    const w = a.weather;
    const weatherLabels: Record<string, string> = {
      rain: "下雨", snow: "下雪", clear: "晴天", overcast: "阴天",
      storm: "暴风雨", fog: "有雾", drizzle: "飘着小雨",
    };
    lines.push(
      `${a.location.city}的天气: ${weatherLabels[w.condition] || w.condition}, ` +
      `${w.temperature}°C。`
    );

    // 日光
    if (w.sunlight === "none" && t.timeOfDay !== "midnight") {
      lines.push("天色昏暗，阳光稀少。");
    }
  } else if (a.location) {
    lines.push(`对方在${a.location.city}。`);
  }

  return lines.length > 0 ? "\n## 环境感知\n" + lines.join("\n") + "\n" : "";
}

// ==================== 工具描述段落 [4] ====================

function buildToolsSection(ctx: AgentContext): string {
  const tools = listToolDefinitions();
  if (tools.length === 0) return "";

  const descriptions = tools
    .map((t) => {
      const params = t.input_schema.properties
        ? Object.entries(t.input_schema.properties)
            .map(([k, v]) => `  - ${k}: ${v.description}`)
            .join("\n")
        : "  无参数";
      return `### ${t.name}\n${t.description}\n参数:\n${params}`;
    })
    .join("\n\n");

  return `\n## 可用工具\n${descriptions}\n\n${ctx.config.toolGuidance}\n`;
}

// ==================== 主入口 ====================

export function buildSystemPrompt(ctx: AgentContext): string {
  const c = ctx.config;

  const sections = [
    // [0] 环境感知
    buildAmbientSection(ctx),

    // [1] 角色层
    c.identityDescription,
    `称呼对方为"${c.addressing}"。称呼南志锦为"${c.masterTitle}"。`,
    "",

    // [2] 关系感知 (P1 用 static 占位, P5 替换为 IWM 摘要)
    ctx.name
      ? `你正在跟 ${ctx.name} 对话。他的身份: ${ctx.identity}。`
      : "你正在跟一位新访客对话。",
    ctx.memoryContext
      ? `之前对话的记忆:\n${ctx.memoryContext}`
      : "这是你们第一次见面。",
    "",

    // [3] 人格注入 (P1 用 config 静态参数, P5 替换为 filter.ts)
    `你的当前语气: 温暖度 ${c.warmth}, 正式度 ${c.formality}, 活泼度 ${c.playfulness}。`,
    c.emotionClamp[1] < 1.0
      ? "你的情绪表达被钳制 — 保持专业形象，不展示极端情绪。"
      : "你可以表达真实的情绪，不需要过滤。",
    "",

    // [4] 工具层
    buildToolsSection(ctx),

    // [5] 行为准则
    "## 行为准则",
    ...c.behaviorRules.map((r) => `- ${r}`),
    "",

    // [6] 当前上下文
    ctx.project
      ? `客人正在浏览「${ctx.project}」项目展厅。根据展厅内容调整引导话术。`
      : "客人正在首页。主动介绍主人的技术栈和核心项目，问客人想了解哪个。",
  ];

  return sections.filter(Boolean).join("\n");
}
