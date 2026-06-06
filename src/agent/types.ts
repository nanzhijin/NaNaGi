// ============================================================
// NaNaGi Agent 核心类型 — P1-1
// 所有 Agent 系统类型有且仅有一份定义在此
// 不依赖 personality/ 或其他任何文件
// ============================================================

// ==================== 工具系统 ====================

/** 工具定义 — 对标 Anthropic tool_use JSON Schema */
export interface ToolDefinition {
  name: string;
  description: string; // 自然语言描述 — 模型靠这个判断何时调用
  input_schema: {
    type: "object";
    properties: Record<
      string,
      {
        type: string; // "string" | "number" | "boolean"
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

/** 工具调用 — 模型决定"我要调这个工具" */
export interface ToolCall {
  id: string; // "toolu_01ABC..."
  name: string; // 工具名
  arguments: Record<string, unknown>; // 模型自动填充的参数
}

/** 工具执行结果 */
export interface ToolResult {
  tool_call_id: string;
  content: string; // 结果序列化为文本, 注入到下一轮 LLM 的 tool message
  is_error?: boolean; // true → 告诉模型"这个工具执行出错了"
}

// ==================== 消息结构 ====================

/** Agent 对话消息 — DeepSeek Anthropic 兼容格式 */
export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[]; // assistant 消息中携带的工具调用
  tool_call_id?: string; // tool 消息中关联的工具调用 ID
  name?: string; // tool 消息中关联的工具名
}

// ==================== 通道参数 ====================

/** 通道配置 — 决定 NaNaGi 在不同社交情境中的行为参数 */
export interface ChannelConfig {
  role: "admin" | "guest-iv" | "guest";

  // 角色层
  identityDescription: string;
  addressing: string; // 对方称呼: "客人"|"您"|"主人"
  masterTitle: string; // 南志锦的称呼

  // 情绪
  emotionClamp: [number, number]; // [min, max] → guest: [0.3, 0.7], admin: [0.0, 1.0]

  // 社交目标
  goals: string[]; // guest: 4预设, admin: [] (0义务)

  // Gross 策略偏好
  strategyPreference: {
    situationSelection: "disabled" | "enabled"; // 能否选择不参与对话
    situationModification: "gentle" | "direct"; // 改变话题走向的方式
    attentionalDeployment: "technical" | "emotional"; // 注意力焦点
    cognitiveReappraisal: "professional" | "personal"; // 重新解读角度
    responseModulation: "frequent" | "rare"; // 隐藏情绪的频率
  };

  // 行为准则
  behaviorRules: string[];

  // 工具使用引导
  toolGuidance: string;

  // 语气静态参数 (P5 替换为 filter.ts 动态输出)
  warmth: number;
  formality: number;
  playfulness: number;
}

// ==================== Agent 上下文 ====================

/** 每次对话请求的核心载体 — "我在跟谁说话"的全部信息 */
export interface AgentContext {
  personId: string; // "nanzhijin" | "guest-V8k3m..."
  role: "admin" | "guest-iv" | "guest";
  name: string; // 对方的名字
  identity: string; // "主人" | "面试官" | "普通用户"

  config: ChannelConfig; // 当前通道参数 (guestConfig | adminConfig)

  // 可选上下文
  project?: string; // 当前展厅 slug (fruit-cnn | cnn-music | gnn)
  cellId?: string; // 当前 Cell ID

  // 环境感知 (每次请求自动获取, 不经 LLM)
  ambient?: AmbientSnapshot | null;

  // 记忆上下文 (现有 buildMemoryContext 输出)
  memoryContext?: string;

  // SSE 事件发射器 (由 agentLoop 注入, 工具用此发送副作用事件)
  _emit?: (event: Record<string, unknown>) => void;
}

// ==================== 环境感知 ====================

/** 时间上下文 — new Date(), <1ms */
export interface TimeSnapshot {
  timeOfDay: "dawn" | "morning" | "forenoon" | "afternoon" | "evening" | "night" | "midnight";
  dayOfWeek: "weekday" | "weekend";
  season: "spring" | "summer" | "autumn" | "winter";
  isHoliday: boolean; // 中国法定节假日 (查表)
  hoursSinceLastTalk: number; // 距上次对话小时数 (暂留 0)
  isFirstMeeting: boolean; // 是否首次对话
}

/** 地理快照 — geoip-lite, <1ms */
export interface LocationSnapshot {
  city: string;
  country: string;
  timezone: string;
  coordinates: { lat: number; lng: number };
}

/** 天气快照 — 和风 API, 1h 内缓存 <1ms */
export interface WeatherSnapshot {
  condition: string; // "rain" | "snow" | "clear" | "overcast" | "storm" | "fog" | "drizzle"
  temperature: number; // °C
  humidity: number; // 0-100
  windSpeed: number; // m/s
  sunlight: "none" | "low" | "medium" | "high"; // 推导值
}

/** 环境感知快照 — 每次请求在 route.ts 自动获取 */
export interface AmbientSnapshot {
  time: TimeSnapshot;
  location: LocationSnapshot | null; // IP 查不到 → null
  weather: WeatherSnapshot | null; // API 失败或缓存超时未刷新 → null
}

// ==================== ReAct 循环状态 ====================

/** ReAct 循环运行时状态 */
export interface LoopState {
  round: number; // 当前轮次 (1-5)
  callHistory: string[]; // 工具调用 hash 历史 — 循环检测用
  stopReason: LoopStopReason | null;
}

/** 循环终止原因 */
export type LoopStopReason =
  | "natural_stop" // 模型输出纯文本, 无 tool_use — 自然结束
  | "max_rounds" // 达到 5 轮上限
  | "repeated_call" // 连续两次调用同一工具且参数相同 → 判定循环
  | "tool_error"; // 工具执行抛出异常

// ==================== 容灾 ====================

/** 三层容灾配置 */
export interface ResilienceConfig {
  timeout: number; // ms, 默认 30_000
  maxRetries: number; // 默认 1
  fallbackMessage: string; // 降级回复 — 因 role 不同而措辞不同
}

// ==================== LLM 响应 ====================

/** LLM 的两种可能输出 */
export type LLMResponse =
  | { type: "text"; content: string } // 纯文本 → SSE 推送, 循环结束
  | { type: "tool_use"; toolCalls: ToolCall[] }; // 工具调用 → 执行 → 注入 → 继续循环
