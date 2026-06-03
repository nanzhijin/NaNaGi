// ============================================================
// NaNaGi V2 — 结构化类型系统
// ============================================================

// ==================== SSE 事件协议 ====================

/** NaNaGi 口播文本 */
export interface TextEvent {
  type: "text";
  content: string;
}

/** 唱片机状态 */
export type JukeboxStatus = "idle" | "loading" | "show_image" | "done";
/** 唱片机模式 — 对应三个项目 */
export type JukeboxMode = "classify" | "recommend" | "retrieve";

/** 唱片机控制指令 */
export interface JukeboxPayload {
  status: JukeboxStatus;
  mode?: JukeboxMode;
  imageUrl?: string;
}

/** 导航指令 */
export interface NavigatePayload {
  href: string;
  text: string;
}

/** 动作事件 — 控制前端 UI 行为 */
export interface ActionEvent {
  type: "action";
  action: "jukebox" | "navigate" | "memory_updated";
  payload: JukeboxPayload | NavigatePayload;
}

/** 模型原始输出 */
export interface ModelResultData {
  model: string;            // "fruit-cnn" | "gnn" | "cnn-music"
  topLabel: string;         // 最佳预测标签
  confidence: number;       // 置信度 0-1
  allPredictions: Prediction[]; // Top-K 完整预测
}

export interface Prediction {
  label: string;
  probability: number;
}

export interface ModelResultEvent {
  type: "model_result";
  model: string;
  result: ModelResultData;
}

/** SSE 事件联合类型 */
export type SSEEvent = TextEvent | ActionEvent | ModelResultEvent;

// ==================== DeepSeek Tool Definitions ====================

/** Anthropic 兼容 Tool Definition */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

/** 当前可用的工具列表 */
export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "navigate_to_project",
    description:
      "引导客人进入项目互动展厅。客人要求展示项目或想了解某个项目细节时调用。",
    input_schema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "项目标识",
          enum: ["fruit-cnn", "cnn-music", "gnn"],
        },
      },
      required: ["project"],
    },
  },
  {
    name: "hunyuan_generate_image",
    description:
      "调用主人的混元生图模型，根据描述生成图片。客人要求画图时调用。生成后自动进入CNN识别流程。",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "生图提示词，描述要画什么（例：'一个新鲜的红色西瓜'）",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "gnn_recommend_friends",
    description:
      "调用主人的GNN社交图谱模型，根据用户画像推荐好友。在GNN项目展厅中使用。",
    input_schema: {
      type: "object",
      properties: {
        user_profile: {
          type: "string",
          description: "模拟用户画像描述（例：'喜欢运动品牌的年轻用户'）",
        },
      },
      required: ["user_profile"],
    },
  },
  {
    name: "cnnmusic_search",
    description:
      "调用主人的CnnMusic多模态召回模型，根据音乐风格检索匹配的播客。在CnnMusic项目展厅中使用。",
    input_schema: {
      type: "object",
      properties: {
        style: {
          type: "string",
          description: "音乐风格或描述（例：'爵士'、'古典钢琴'、'电子氛围'）",
        },
      },
      required: ["style"],
    },
  },
];

// ==================== 聊天消息 ====================

export interface Message {
  id: string;
  role: "agent" | "user";
  content: string; // 纯文本（用于聊天气泡渲染）
  imageUrl?: string; // 🔮 混元生成的图片，在聊天气泡内展示
}

// ==================== 唱片机状态 ====================

export interface JukeboxState {
  status: JukeboxStatus;
  mode: JukeboxMode | null;
  imageUrl: string | null;
}
