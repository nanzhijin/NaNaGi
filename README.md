# NaNaGi（ななぎ）

**南志锦的个人 AI 作品集网站。NaNaGi——主人的专属AI女仆兼小狐娘，以女仆身份接待面试官，引导对话、展示项目。**

---

## 设计理念

传统作品集 = 静态页面 + 项目列表。面试官只能被动浏览。

NaNaGi = **AI 女仆引导一切**。面试官输入密码进入后，NaNaGi 以女仆身份问候，介绍主人的技术能力和项目，主动引导对话。不是"看网站"，是"跟南志锦的女仆聊"。

```
访问 → 密码登录 → NaNaGi自我介绍 → 介绍主人的简历+项目经验
  → 客人选择感兴趣的项目 → NaNaGi介绍项目 → 客人点击按钮
  → 跳转项目互动展厅 → 拖拽图片到唱片机 → 推理识别
  → NaNaGi口播结果 → 模型原始输出独立展示
```

### NaNaGi 人设

| 维度 | 设定 |
|------|------|
| 名字 | NaNaGi（ななぎ） |
| 身份 | 南志锦的专属女仆 + 小狐娘 + AI向导 🦊 |
| 性格 | 活泼可爱、细心周到、对主人的技术能力充满自豪 |
| 口吻 | 称南志锦"主人"、称访客"客人"或"您" |
| 风格 | 偶尔用可爱表达（"呢"、"哦"、"～"、"✨"、"🦊"），技术讨论时保持专业 |

### Agent 类型定位

NaNaGi 是一个 **Bounded-Domain Personal Companion Agent**（域定型个人陪伴智能体）。

与 Claude Code 这类 **Sovereign Agent**（主权型，可操作文件系统/终端/代码）不同，NaNaGi 的工具有明确的边界——时间、天气、记忆检索、网络搜索、图像生成——但在这个边界内，她具备完整的 Agent 特征：**自主工具选择、多步推理、多 Agent 协作**。

核心架构（编排层 + 工具注册表）是通用的、可迁移的。把 companion 工具集替换为代码执行/文件操作，即可变为编程 Agent。

```
Agent 分类:
  ├── Sovereign Agent（主权型）
  │     eg: Claude Code, Devin, AutoGPT
  │     特征: 控制环境、操作文件、执行代码
  │
  └── Bounded Agent（域定型）★ NaNaGi
        eg: NaNaGi, ChatGPT, Perplexity
        特征: 在定义好的工具范围内自主决策
```

---

## 双账户系统

| | 面试官账户 | 主人账户 |
|------|-----------|----------|
| 密码 | `1661186826` | `6411NANZHIjin985` |
| 角色 | `guest` | `admin` |
| 聊天 | ✅ | ✅ |
| 看项目 | ✅ | ✅ |
| 看记忆文件 | ✅ 只读 | ✅ 只读 |
| 删记忆文件 | ❌ | ✅ 可删除 |
| 记忆自动记录 | 框架自动 | 框架自动 |

---

## 核心功能

### 已实现 ✅

| 功能 | 说明 |
|------|------|
| **NaNaGi Agent 对话** | DeepSeek V4 Pro 引擎，Anthropic 兼容端点，流式 SSE |
| **密码鉴权** | bcrypt 双密码 + JWT 角色 + httpOnly cookie |
| **混元生图** | 腾讯混元 hy-image-v3.0，异步 submit + 轮询 query |
| **可拖拽图片** | 聊天框内图片可拖拽，松手弹回，带下载按钮 |
| **唱片机互动** | 项目页拖图片进唱片机 → 魔法扫描识别动画 |
| **记忆系统** | Claude Code 风格文件记忆，**双路径架构**：NaNaGi 主动记忆 + 框架兜底拦截 |
| **记忆面板** | 左侧滑出，像素风卡片，悬浮放大，单击查看，管理员删除 |
| **记忆注入** | 每次对话自动注入已有记忆到 System Prompt，跨会话"记住"访客 |
| **聊天持久化** | sessionStorage 跨页面导航保持 + 刷新恢复 |
| **项目展厅** | 3 个项目页（FruitCNN / CnnMusic / GNN），SSG 预渲染 |
| **三风格设计系统** | 女仆围裙 + 像素下午茶 + 星尘备忘录 |

### 规划中 🔮

| 能力 | 说明 | 所属阶段 |
|------|------|---------|
| **Tool Calling 系统** | 6 工具注册表 + JSON Schema + 自主工具调用 | Phase 1 |
| **RAG 向量检索** | embedding + LanceDB + 语义分块 + 相似度检索 | Phase 2 |
| **ReAct 推理循环** | Think→Act→Observe 循环 + 5 轮上限 + 循环检测 | Phase 1 |
| **Multi-Agent 编排** | parallel/pipeline/fanout/loop_until 原语 + 4 种预设 Workflow | Phase 3 |
| **Workflow 系统** | 路由层→编排层→执行层→工具层 四层架构 | Phase 3 |
| **CNN ONNX 推理** | 浏览器端实时图像分类（模型已就绪，待集成） | 后续 |
| **GNN 实时推荐** | Python FastAPI 推理服务（模型已就绪，待部署） | 后续 |
| **CnnMusic 检索** | FAISS 相似度检索服务（模型已就绪，待部署） | 后续 |
| **服务器部署** | 腾讯云 Lighthouse 2C4G 5M，域名 nanagi.cn，ICP 备案中 | 后续 |

---

## Agent 架构设计

### 总览：四层 Agent 架构

NaNaGi 的 Agent 系统仿照 Claude Code 的 Workflow 架构，分为四个层级：

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 0: 路由层 (Router)                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  用户输入 → 意图分类 → 选择 Mode 或组合                      │  │
│  │                                                              │  │
│  │  "帮我研究TypeScript装饰器" → Mode: "deep-research"          │  │
│  │  "给我想几个设计方案"       → Mode: "creative-burst"         │  │
│  │  "今天天气怎么样"           → Mode: "default"（单Agent）      │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1: Workflow 编排层 (Orchestrator)                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Workflow = 预定义的多Agent协作模式                          │  │
│  │                                                              │  │
│  │  编排原语:                                                   │  │
│  │    parallel()  — 多Agent并行执行，汇总结果                   │  │
│  │    pipeline()  — 串行流水线 A→B→C                            │  │
│  │    fanout()    — 多视角发散 → 投票/融合                      │  │
│  │    loop_until() — 迭代执行直到收敛条件满足                   │  │
│  │                                                              │  │
│  │  预设 Workflow:                                              │  │
│  │    deep-research   — 多角度搜索 + 综合 + 挑刺验证            │  │
│  │    creative-burst  — 多风格头脑风暴 + 评选融合               │  │
│  │    multi-step-plan — Plan → Execute → Verify 三段式          │  │
│  │    debate          — 对立角色辩论 + 裁判裁决                 │  │
│  │    default         — 单 Agent + tool loop（轻量级）          │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2: Agent 执行层 (Single Agent = Independent ReAct Loop)   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  每个 Agent = 独立的 system prompt + 工具子集                │  │
│  │            = 独立的 ReAct 推理循环                           │  │
│  │                                                              │  │
│  │  Agent 角色:                                                 │  │
│  │    SearchAgent     — 研究员，多角度搜索，返回结构化发现       │  │
│  │    SynthesisAgent  — 汇总者，去重+合并+生成报告              │  │
│  │    CritiqueAgent   — 审稿人，挑出漏洞/矛盾/遗漏              │  │
│  │    BrainstormAgent — 头脑风暴，按指定风格发散创意            │  │
│  │    SelectorAgent   — 评选者，按标准评估并融合最佳方案        │  │
│  │    JudgeAgent      — 裁判，听取双方辩论并给出裁决            │  │
│  │    CompanionAgent  — 默认角色，日常对话，女仆身份             │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Layer 3: 工具执行层 (Tool Execution)                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  get_time       — 获取当前日期和时间（本地函数）             │  │
│  │  get_weather    — 查询城市实时天气（和风/OpenWeather API）   │  │
│  │  search_memory  — 语义搜索记忆库（LanceDB 向量检索）        │  │
│  │  save_memory    — 主动保存记忆（文件+向量双写）             │  │
│  │  search_web     — 联网搜索（Bing/SerpAPI）                  │  │
│  │  generate_image — AI 图片生成（混元 API）                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 设计参考：Claude Code Workflow 系统

NaNaGi 的编排层灵感来自 Claude Code 的内部 Workflow 引擎：

| Claude Code 原语 | NaNaGi 实现 | 用途 |
|------------------|------------|------|
| `agent()` — 独立子Agent | `Agent` 执行层 | 每个 Agent = 独立 system prompt + ReAct loop |
| `parallel()` — 并发屏障 | `parallel(tasks)` | 多 Agent 同时执行，收集所有结果后继续 |
| `pipeline()` — 流式管道 | `pipeline(stages)` | A→B→C 串行，后阶段接收前阶段输出 |
| `phase()` — 进度分组 | `WorkflowPhase` 标记 | 同一 phase 下的 Agent 在 UI 中编组展示 |
| `log()` — 进度消息 | SSE `action:progress` | 推送编排进度到前端 |
| loop-until-count | `loopUntil(condition)` | 迭代直到达到目标数量或收敛 |

---

## Phase 1: Tool Calling 系统

### 设计原则

**对标 Claude Code Tool Schema**：每个工具三要素——name、description、parameters（JSON Schema），模型通过 description 理解何时调用。

```typescript
// === 工具类型定义（对标 Claude Code tool_use block）===

interface ToolDefinition {
  name: string;                                 // "get_weather"
  description: string;                          // 自然语言描述，模型靠这个判断何时调用
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;                             // "string" | "number" | "boolean"
      description: string;                      // 参数说明
      enum?: string[];                          // 参数可选值约束
    }>;
    required: string[];                         // 必填参数
  };
}

interface ToolCall {
  id: string;                                   // 调用ID，关联结果
  name: string;                                 // 工具名
  arguments: Record<string, unknown>;           // 模型自动填充的参数
}

interface ToolResult {
  tool_call_id: string;
  content: string;                              // 结果序列化为文本
  is_error?: boolean;                           // 工具执行异常标记
}
```

### 六工具详细定义

#### 1. `get_time` — 获取时间

```typescript
{
  name: "get_time",
  description: "获取当前日期和时间。当用户询问'现在几点''今天几号''当前时间'时调用。",
  parameters: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "IANA 时区名，如 'Asia/Shanghai'。不填默认 Asia/Shanghai"
      }
    },
    required: []
  }
}
```

- **实现**: 本地 `new Date().toLocaleString()`，零外部依赖
- **返回格式**: `"2026年6月3日 星期三 14:30:00 (Asia/Shanghai)"`

#### 2. `get_weather` — 查询天气

```typescript
{
  name: "get_weather",
  description: "查询指定城市的实时天气。当用户询问天气、气温、是否下雨、出门建议时调用。",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "城市名称，支持中文（'杭州'）或英文（'Hangzhou'）"
      }
    },
    required: ["city"]
  }
}
```

- **API**: 和风天气（免费，日1000次）或 OpenWeather One Call API
- **返回格式**: 天气现象、温度、湿度、风速、体感温度
- **降级策略**: API 不可用时返回 `{"error": "天气服务暂时不可用"}`

#### 3. `search_memory` — 语义搜索记忆

```typescript
{
  name: "search_memory",
  description: "搜索主人的历史记忆。当需要了解主人的偏好、背景、过往对话时调用。使用语义相似度检索，而非关键词匹配。",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索查询，用自然语言描述想找什么。例如 '主人对天气的偏好' '主人的穿衣风格'"
      },
      top_k: {
        type: "number",
        description: "返回最相关的几条记忆，默认 5"
      }
    },
    required: ["query"]
  }
}
```

- **检索管道**: query → embedding（同一模型）→ LanceDB.topK(cosine) → 格式化结果
- **返回格式**: 每条记忆的 description + content 摘要 + 相似度分数

#### 4. `save_memory` — 保存记忆

```typescript
{
  name: "save_memory",
  description: "主动保存一条关于访客或对话的记忆。当发现重要的用户信息、偏好、决策时自主调用，无需用户说'记住'。",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "要保存的记忆内容"
      },
      type: {
        type: "string",
        enum: ["user", "project", "impression", "feedback"],
        description: "记忆类型"
      }
    },
    required: ["content", "type"]
  }
}
```

- **双写策略**: ① 写 `.md` 文件（兼容现有 MEMORY.md 索引）② 写 LanceDB 向量存储
- **去重**: 写前检查最近 50 条记忆的 embedding 相似度，>0.9 则跳过（防重复记忆）

#### 5. `search_web` — 网络搜索

```typescript
{
  name: "search_web",
  description: "联网搜索最新信息。当用户询问时事、技术动态、需要外部知识时调用。仅当内置知识和记忆不足以回答时使用。",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索关键词"
      },
      num_results: {
        type: "number",
        description: "返回结果数，默认 5，最大 10"
      }
    },
    required: ["query"]
  }
}
```

- **API**: Bing Web Search API 或 SerpAPI
- **返回**: 标题 + URL + 摘要，格式化为文本

#### 6. `generate_image` — AI 生图

```typescript
{
  name: "generate_image",
  description: "使用 AI 生成图片。当用户要求'画一张''生成图片''帮我做一张图'时调用。",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "图片生成提示词，支持中文和英文"
      }
    },
    required: ["prompt"]
  }
}
```

- **API**: 腾讯混元 hy-image-v3.0（已有，复用）
- **流程**: 异步 submit → 轮询 query → 返回图片 URL

---

## Phase 2: RAG 向量检索管道

### 架构概览

```
写入路径（创建记忆时触发）:
  .md 文件 ──→ Chunker（语义分块）──→ Embedder ──→ LanceDB
                   │                      │            │
              按段落切分              文本→向量      持久化存储
              保留上下文重叠          768维向量      索引+元数据
              最大512 token/块

检索路径（search_memory 触发）:
  查询文本 ──→ Embedder ──→ LanceDB.search(topK=5)
                    │                │
               同一嵌入模型      余弦相似度排序
                                      │
                                      ▼
                            结果格式化为文本
                                      │
                                      ▼
                            注入 System Prompt
```

### 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| Embedding 模型 | DeepSeek Embedding API（首选）或 `all-MiniLM-L6-v2`（本地备选） | 384维，高性价比，transformers.js 可在 Node.js 直接跑 |
| 向量数据库 | **LanceDB** | 嵌入式、无服务、列式存储、Native Node.js 绑定、无需独立部署 |
| 分块策略 | 语义分块 + 滑动窗口 | 按段落边界切分，保留前1句 + 后1句作为上下文重叠窗口 |
| 相似度度量 | 余弦相似度 | 标准选择，LanceDB 原生支持 |

### 为什么选 LanceDB 而非其他

| 方案 | 问题 |
|------|------|
| Pinecone / Weaviate Cloud | 需付费 + 网络延迟 + 对个人项目过重 |
| Chroma | Python-first，Node.js 支持弱 |
| FAISS | 需独立部署服务，NaNaGi 跑在浏览器端 |
| Qdrant | 需 Docker，不适合嵌入 |
| **LanceDB** ✅ | 嵌入式（零依赖）、列式存储（读性能好）、原生 Node.js SDK、按文件持久化 |

### 分块器设计

```typescript
interface Chunk {
  id: string;                    // 块唯一ID
  memory_slug: string;           // 关联的记忆文件 slug
  text: string;                  // 块文本内容
  index: number;                 // 块序号
  metadata: {
    type: MemoryType;            // 记忆类型
    description: string;         // 记忆描述
    prev_chunk_id?: string;      // 前一块ID（用于上下文扩展）
    next_chunk_id?: string;      // 后一块ID
  };
}

// 分块参数
const CHUNK_CONFIG = {
  max_tokens: 512,               // 每块最大 token 数
  overlap_tokens: 50,            // 前后窗口重叠 token
  split_on: "\n\n",              // 优先在段落边界切分
};
```

### 去重策略

每次 `save_memory` 写入前：
1. 计算新内容的 embedding
2. 检索最近 N 条记忆的 top-3 相似结果
3. 若最高相似度 > 0.9 → 判定为重复 → 跳过写入
4. 若在 0.7–0.9 之间 → 追加为同一主题的更新（保留旧记录，关联新旧）

---

## Phase 3: ReAct 推理循环

### 核心设计

每个 Agent 执行时运行独立的 ReAct 循环，对标 Claude Code 的工具调用循环：

```
┌──────────────────────────────────────────────────────┐
│                   Agent Loop                          │
│                                                       │
│  用户输入                                               │
│     │                                                  │
│     ▼                                                  │
│  ┌─────────────────────────────────────────┐          │
│  │          System Prompt（动态拼接）        │          │
│  │  ┌─────────────────────────────────────┐│          │
│  │  │ ① 角色设定（固定）                   ││          │
│  │  │ ② 工具说明（从 ToolDefinition[] 生成）││          │
│  │  │ ③ 记忆注入（RAG 检索结果，动态）      ││          │
│  │  │ ④ 行为准则（固定）                   ││          │
│  │  └─────────────────────────────────────┘│          │
│  └──────────────────┬──────────────────────┘          │
│                     │                                  │
│                     ▼                                  │
│  ┌─────────────────────────────────────────┐          │
│  │        DeepSeek V4 Pro 推理               │          │
│  │  输出: text 或 tool_use（由模型自主决定）   │          │
│  └──────┬──────────────┬───────────────────┘          │
│         │              │                               │
│    finish_reason    finish_reason                      │
│    = "stop"         = "tool_calls"                     │
│         │              │                               │
│         ▼              ▼                               │
│   纯文本回复      ┌────────────────────┐               │
│   循环结束        │  并行执行所有工具    │               │
│         │         │  Promise.all(tools) │               │
│         │         └────────┬───────────┘               │
│         │                  │                           │
│         │                  ▼                           │
│         │         工具结果注入消息历史                  │
│         │         assistant(tool_calls)                │
│         │         + tool(result) × N                   │
│         │                  │                           │
│         │                  ▼                           │
│         │         回到 LLM 推理（继续循环）             │
│         │         最多 5 轮                             │
│         │                  │                           │
│         ▼                  ▼                           │
│        返回文本（含工具使用过程）                        │
└──────────────────────────────────────────────────────┘
```

### 循环终止条件

```typescript
const MAX_ROUNDS = 5; // 最大推理轮数

// 终止条件（仿照 Claude Code）
enum LoopStopReason {
  NATURAL_STOP = "natural_stop",       // 模型输出纯文本，无 tool_use
  MAX_ROUNDS = "max_rounds",           // 达到 5 轮上限
  REPEATED_CALL = "repeated_call",     // 连续两次调用同一工具且参数相同（检测循环）
  TOOL_ERROR = "tool_error",           // 工具执行抛出异常（返回错误文本继续，不中断）
}
```

### 消息结构

```typescript
// DeepSeek API 兼容格式
interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];            // assistant 消息中的工具调用
  tool_call_id?: string;              // tool 消息中的关联ID
  name?: string;                      // tool 消息中的工具名
}
```

### 循环检测逻辑

```typescript
function detectLoop(newCalls: ToolCall[], history: AgentMessage[]): boolean {
  // 找上一次 assistant 消息的 tool_calls
  const lastAssistant = history.filter(m => m.role === "assistant" && m.tool_calls).pop();
  if (!lastAssistant?.tool_calls) return false;

  // 比较：相同 name + 相同 arguments → 判定为循环
  const prevCalls = lastAssistant.tool_calls;
  if (prevCalls.length !== newCalls.length) return false;

  return newCalls.every((call, i) =>
    call.name === prevCalls[i].name &&
    JSON.stringify(call.arguments) === JSON.stringify(prevCalls[i].arguments)
  );
}
```

---

## Phase 3: Multi-Agent Workflow 编排系统

### 四种编排原语

```typescript
// === 原语 1: parallel — 并发屏障 ===
// 所有子Agent同时启动，全部完成后返回结果数组
// 适用场景: 多角度搜索、多风格生成
async function parallel<T>(
  tasks: AgentTask[],
  config?: { timeout?: number }       // 单个Agent超时（可选）
): Promise<(AgentResult | null)[]>
// 单个Agent失败 → 对应位置返回 null，不影响其他Agent
// 对标 Claude Code: parallel(thunks)

// === 原语 2: pipeline — 串行管道 ===
// 顺序执行 Agent 链，每个Agent的输出作为下一个的输入
// 适用场景: 搜索→综合→挑刺
async function pipeline<T>(
  stages: AgentTask[]
): Promise<AgentResult>
// 某阶段失败 → 管道中断，返回错误信息
// 对标 Claude Code: pipeline(items, stage1, stage2, ...)

// === 原语 3: fanout — 发散再收敛 ===
// 同一任务从多个视角执行 → 投票/评分融合
// 适用场景: 创意生成、决策辅助
async function fanout(
  task: Task,                          // 统一任务描述
  perspectives: string[],              // 各视角的 system prompt variant
  fusion: "vote" | "score" | "merge"   // 融合策略
): Promise<ConsensusResult>
// 对标 Claude Code: 多Judge panel投票模式

// === 原语 4: loop_until — 迭代收敛 ===
// 重复执行 Agent 直到满足停止条件
// 适用场景: 搜索直到无新发现、优化直到满足标准
async function loopUntil(
  task: Task,
  criterion: {
    type: "dryness" | "count" | "quality"; // 停止类型
    max_iterations: number;                 // 安全上限
    dry_threshold?: number;                 // dryness 模式下连续无新发现的轮数
    target_count?: number;                  // count 模式下的目标数量
  }
): Promise<AgentResult[]>
// 对标 Claude Code: loop-until-dry / loop-until-count
```

### 五种预设 Workflow

#### 1. `deep-research` — 深度研究

```
用户提问 "研究一下TypeScript 5.0装饰器的变化"
    │
    ▼
parallel(3 × SearchAgent)           ← 3个Agent从不同角度搜索
  ├── SearchAgent: "搜索TypeScript 5.0装饰器语法变化"
  ├── SearchAgent: "搜索TypeScript 5.0装饰器与旧版兼容性"
  └── SearchAgent: "搜索TypeScript 5.0装饰器社区反馈和最佳实践"
    │
    ▼
SynthesisAgent                      ← 汇总去重 + 生成结构化报告
    │
    ▼
CritiqueAgent                       ← 挑刺：有遗漏？有矛盾？有未验证的声明？
    │
    ▼
SynthesisAgent（修正版）            ← 根据挑刺意见修正报告
    │
    ▼
最终输出
```

#### 2. `creative-burst` — 创意爆发

```
用户提问 "给我设计一个Logo"
    │
    ▼
fanout(3 × BrainstormAgent)         ← 3个Agent用不同风格发散
  ├── BrainstormAgent: 极简主义风格
  ├── BrainstormAgent: 赛博朋克风格
  └── BrainstormAgent: 中国风传统风格
    │
    ▼
SelectorAgent                       ← 评分 + 选出最佳 + 融合亮点
    │
    ▼
最终方案（含评分和选择理由）
```

#### 3. `multi-step-plan` — 多步规划执行

```
用户提问 "帮我规划周末出行"
    │
    ▼
PlanAgent                           ← 分析任务 → 拆解为步骤列表
  "Step 1: 查天气 / Step 2: 搜偏好 / Step 3: 搜景点 / Step 4: 生成计划"
    │
    ▼
ExecuteAgent                        ← 逐步执行，观察中间结果，按需调整后续步骤
  每个 step 可能触发独立的 Tool Calling（查天气、搜记忆、搜网页）
    │
    ▼
VerifyAgent                         ← 检查计划是否完整、可执行、符合用户偏好
    │
    ▼
最终计划
```

#### 4. `debate` — 辩论裁决

```
用户提问 "我应该买Mac还是Windows笔记本"
    │
    ▼
parallel(2 × Agent)                 ← 两个Agent持对立立场
  ├── Pro-Mac Agent: 从设计/生态/续航角度论证
  └── Pro-Windows Agent: 从兼容性/价格/游戏角度论证
    │
    ▼
JudgeAgent                          ← 听取双方论点 → 结合用户背景 → 给出裁决
    │
    ▼
结构化裁决（推荐 + 理由 + 适用场景分析）
```

#### 5. `default` — 默认模式

```
单 CompanionAgent
  → 日常对话 + 按需工具调用
  → 不启动 Workflow 编排，最小延迟
```

### 前端进度展示

Workflow 执行期间，通过 SSE 推送进度：

```
event: action:progress
data: {
  "workflow": "deep-research",
  "phase": "search",
  "agents": [
    { "id": "search-1", "status": "running", "label": "搜索: TS装饰器语法" },
    { "id": "search-2", "status": "running", "label": "搜索: 旧版兼容性" },
    { "id": "search-3", "status": "running", "label": "搜索: 社区最佳实践" }
  ],
  "progress": "2/3 完成"
}
```

---

## 记忆系统 — Claude Code 风格 · V2.5 双路径架构

**核心理念**：复刻 Claude Code 文件记忆架构（`/data/memory/MEMORY.md` 索引 + `*.md` 记忆文件），让 NaNaGi 像真正的 AI 助手一样"记住"每次对话。

### 双路径写入

```
访客说话
  ├── 路径A（主力）：NaNaGi 主动判断 → 调用 save_memory 工具
  │     语义理解 + 自主决策，不等客人说"记住"
  │
  └── 路径B（兜底）：框架检测触发词 → 自动写入
        正则匹配"记忆/记住/记录/memory" → 确定性兜底
```

### 记忆注入（跨会话持久化）

```
每次聊天请求
  → buildMemoryContext() 读取 /data/memory/ 下所有记忆
  → 按类型分组（访客档案/项目记忆/印象笔记/反馈记录）
  → 注入 System Prompt 末尾「已有记忆」区域
  → NaNaGi 在新对话中自然融入之前的记忆 ✨
```

### 文件结构

```
/data/memory/
├── MEMORY.md              ← 自动维护的索引（按类型分组）
├── mem-*.md               ← 记忆文件（YAML frontmatter + Markdown）
└── ...
```

### 记忆内容结构

```markdown
## 用户消息
<客人原始消息>

## NaNaGi 回复摘要
<AI回复的300字摘要，而非完整流水账>
```

---

## SSE 流协议

| event type | 作用 |
|------------|------|
| `text` | NaNaGi 说的话，进聊天气泡 |
| `action:jukebox` | 控制唱片机状态 |
| `action:navigate` | 跳转项目页 |
| `action:memory_updated` | 通知前端刷新记忆面板 |
| `action:progress` | Workflow 执行进度（Phase 3） |
| `model_result` | 模型原始推理结果 |

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + TypeScript + React 19 |
| 样式 | Tailwind CSS 4 + 像素风三风格设计系统 |
| AI 引擎 | DeepSeek V4 Pro（Anthropic 兼容端点） |
| Agent 框架 | 自研四层架构：Router → Orchestrator → Agent → Tool |
| 工具注册 | JSON Schema 工具定义（对标 Claude Code） |
| 向量数据库 | LanceDB（嵌入式、零部署） |
| Embedding | DeepSeek Embedding API / all-MiniLM-L6-v2（本地备选） |
| RAG 分块 | 语义分块 + 滑动窗口（512 token/chunk，50 token overlap） |
| 鉴权 | bcryptjs + jose (JWT) + 双角色 |
| 生图 | 腾讯混元 hy-image-v3.0 |
| 记忆存储 | 双写：文件系统（YAML frontmatter + Markdown）+ LanceDB 向量存储 |
| 部署 | Docker → 腾讯云 Lighthouse 2C4G 5M |

---

## 本地运行

```bash
npm install
cp .env.example .env.local  # 填入 API Key
npm run dev                  # http://localhost:3000
```

---

## 环境变量

`.env.local`（不提交到 Git）：

| 变量 | 说明 |
|------|------|
| `NANAGI_PASSWORD_HASH` | 面试官密码 bcrypt hash |
| `NANAGI_ADMIN_PASSWORD_HASH` | 管理员密码 bcrypt hash |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `HUNYUAN_API_KEY` | 混元生图 API Key |
| `HUNYUAN_KEY_ID` | 混元 Key ID |
| `WEATHER_API_KEY` | 和风天气 API Key（Phase 1） |
| `SEARCH_API_KEY` | Bing/SerpAPI Key（Phase 1） |
| `MEMORY_DIR` | 记忆文件存储路径（默认 `./data/memory/`） |

---

## 路线图

### V1 ✅ — 网站骨架
- [x] Next.js 项目框架 + 三风格设计系统
- [x] DeepSeek V4 Pro 流式对话
- [x] bcrypt 双密码鉴权 + JWT
- [x] 3 个项目页（FruitCNN / CnnMusic / GNN）

### V2 ✅ — Agent 雏形
- [x] 混元生图 (hy-image-v3.0)
- [x] 唱片机互动 + 图片拖拽
- [x] 记忆系统 V2.5 双路径架构
- [x] 记忆面板（像素风卡片 + 删除）
- [x] 聊天持久化（sessionStorage）
- [x] SSE 多事件协议

### V2.6 🔥 — Tool Calling + ReAct（当前）
- [ ] `agent/` 目录：types.ts + registry.ts + loop.ts + prompts.ts
- [ ] 6 工具实现：get_time / get_weather / search_memory / save_memory / search_web / generate_image
- [ ] ReAct 循环：5 轮上限 + 循环检测 + 错误降级
- [ ] System Prompt 四段式动态拼接
- [ ] 改造 `/api/chat` 路由使用 agentLoop 替代直接 LLM 调用

### V2.7 🔥 — RAG 管道
- [ ] `rag/` 目录：embedder.ts + chunker.ts + store.ts + pipeline.ts
- [ ] LanceDB 集成 + schema 设计
- [ ] 语义分块器（512 token/chunk + 滑动窗口）
- [ ] 记忆双写（文件 + 向量）
- [ ] search_memory 升级为语义检索
- [ ] 写入前去重（embedding 相似度 >0.9 跳过）

### V3 🔥 — Multi-Agent 编排
- [ ] `orchestrator/` 目录：primitives.ts + workflows.ts + agents.ts
- [ ] 4 编排原语：parallel / pipeline / fanout / loop_until
- [ ] 5 预设 Workflow：deep-research / creative-burst / multi-step-plan / debate / default
- [ ] 7 种 Agent 角色 + 各自独立 system prompt
- [ ] 路由层意图分类（用户输入 → 选择 Workflow）
- [ ] SSE `action:progress` 前端进度展示

### 后续
- [ ] CNN ONNX 浏览器端推理
- [ ] GNN / CnnMusic Python FastAPI 推理服务
- [ ] 腾讯云 Lighthouse 部署上线（nanagi.cn）
- [ ] ICP 备案完成

---

## 岗位关键词映射

NaNaGi 全功能实现后，简历可命中以下 JD 关键词：

| 关键词 | NaNaGi 对应能力 | 架构层级 |
|--------|----------------|----------|
| **Multi-Agent System** | 7 种 Agent 角色 + 编排器 + 路由层 | Layer 0-2 |
| **Agent Orchestration** | parallel/pipeline/fanout/loop_until 原语 + 5 种 Workflow | Layer 1 |
| **Function Calling / Tool Use** | 6 工具 + JSON Schema 注册表 + 模型自主决策 | Layer 3 |
| **RAG / Retrieval Augmented Generation** | embedding → LanceDB → 语义检索 → prompt 注入 | RAG 管道 |
| **ReAct / Agentic Loop** | Think→Act→Observe 循环 + 终止条件检测 | Layer 2 |
| **Prompt Engineering** | 四段式动态拼接 + 每 Agent 独立 system prompt | Layer 2 |
| **Plan-Execute-Verify Pattern** | multi-step-plan workflow | Layer 1 |
| **Adversarial Verification** | CritiqueAgent + debate workflow | Layer 1 |
| **Vector Database** | LanceDB 嵌入式向量存储 + 余弦相似度 | RAG 管道 |
| **Memory / Context Management** | 双路径记忆 + 双写（文件+向量）+ 记忆注入 | 记忆系统 |
| **SSE / Streaming** | 多事件类型 SSE 流协议 | 通信层 |
| **LLM Pipeline** | pipeline 原语 + deep-research workflow | Layer 1 |

---

## 面试话术模板

> "NaNaGi 是一个 bounded-domain 的 personal companion Agent。和 Claude Code 这类 sovereign agent 不同，她的工具有明确的边界——时间、天气、记忆检索、网络搜索、图像生成——但在这个边界内，她具备完整的 Agent 特征：自主工具选择、多步推理、多 Agent 协作。
>
> 架构分四层：路由层做意图分发，编排层实现了 parallel/pipeline/fanout/loop_until 四种协作原语外加 5 种预设 Workflow，执行层每个 Agent 跑独立的 ReAct 循环，工具层注册了 6 个 function。
>
> RAG 管道采用 LanceDB 嵌入式向量数据库 + 语义分块 + 余弦相似度检索，记忆系统是双路径架构（模型主动记忆 + 框架兜底）加双写策略（文件 + 向量）。
>
> 整个架构灵感来自 Claude Code 的内部 Workflow 系统（我每天都在用的工具），但针对 companion 场景做了轻量化适配。如果把手层的工具集换掉，架构本身是通用的——核心价值在编排层，不在具体工具。"

---

## TDP 投稿计划

本项目将投稿至**腾讯云开发者先锋（TDP）公众号**，作为南志锦的专业技术背书。

---

## License

Private — 仅供面试使用。源码不公开。
