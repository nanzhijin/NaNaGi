// ============================================================
// NaNaGi 安全配置中心 — 所有敏感信息的唯一入口
// 集中管理 API Key / Host / Hash，禁止其他文件直接读 process.env
// ============================================================

import "server-only";

// ==================== 类型 ====================

interface EnvConfig {
  // 鉴权
  guestPasswordHash: string;
  adminPasswordHash: string;
  jwtSecret: Uint8Array;

  // AI 引擎
  deepseekApiKey: string;

  // 混元生图
  hunyuanApiKey: string;
  hunyuanKeyId: string;

  // 天气
  weatherApiKey: string;
  weatherApiHost: string;

  // 搜索 (已移除)

  // 运行环境
  nodeEnv: "development" | "production";
  memoryDir: string;
}

// ==================== 安全读取 ====================

function read(key: string, fallback = ""): string {
  const value = process.env[key];
  if (!value && !fallback) {
    console.warn(`[Env] ⚠️ 缺少环境变量: ${key} — 相关功能将不可用`);
  }
  return value || fallback;
}

function readRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[Env] 🔴 必需环境变量未配置: ${key}`);
  }
  return value;
}

// ==================== 单例配置 ====================

let _config: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (_config) return _config;

  _config = Object.freeze({
    // 鉴权 — 回退到占位符 (仅开发环境安全)
    guestPasswordHash: read(
      "NANAGI_PASSWORD_HASH",
      "$2b$10$placeholder_guest"
    ),
    adminPasswordHash: read(
      "NANAGI_ADMIN_PASSWORD_HASH",
      "$2b$10$placeholder_admin"
    ),
    jwtSecret: new TextEncoder().encode(
      read("NANAGI_PASSWORD_HASH", "fallback-secret-change-me")
    ),

    // AI 引擎
    deepseekApiKey: readRequired("DEEPSEEK_API_KEY"),

    // 混元生图
    hunyuanApiKey: read("HUNYUAN_API_KEY"),
    hunyuanKeyId: read("HUNYUAN_KEY_ID"),

    // 天气 — 和风 API
    weatherApiKey: read("WEATHER_API_KEY"),
    weatherApiHost: read(
      "WEATHER_API_HOST",
      "https://api.qweather.com/v7/weather/now"
    ),

    // 搜索 (已移除 search-web 工具, 暂不使用)
    searchApiKey: "",

    // 运行环境
    nodeEnv:
      process.env.NODE_ENV === "production" ? "production" : "development",
    memoryDir: read(
      "MEMORY_DIR",
      `${process.cwd()}/data/memory`
    ),
  });

  return _config;
}

// ==================== 便捷导出 ====================

// 以下函数确保调用链可追溯 — 所有 API key 都通过这里流出

export function getDeepseekKey(): string {
  return getEnv().deepseekApiKey;
}

export function getHunyuanKeys(): { apiKey: string; keyId: string } {
  const env = getEnv();
  return { apiKey: env.hunyuanApiKey, keyId: env.hunyuanKeyId };
}

export function getWeatherConfig(): { apiKey: string; apiHost: string } {
  const env = getEnv();
  return { apiKey: env.weatherApiKey, apiHost: env.weatherApiHost };
}

export function getPasswordHashes(): {
  guest: string;
  admin: string;
} {
  const env = getEnv();
  return { guest: env.guestPasswordHash, admin: env.adminPasswordHash };
}

export function getJwtSecret(): Uint8Array {
  return getEnv().jwtSecret;
}

export function getNodeEnv(): "development" | "production" {
  return getEnv().nodeEnv;
}

export function getMemoryDir(): string {
  return getEnv().memoryDir;
}
