# NaNaGi（ななぎ）

**南志锦的个人 AI 作品集网站。NaNaGi——一个有社交图、有情绪、有记忆的域定型个人陪伴 Agent。**

---

## 设计理念

传统 Agent = 完成任务。NaNaGi = **维持关系**。

她不是"帮你做事的工具"，而是"知道你是谁、记得你什么样、对不同的人不同对待"的关系型 Agent。面试官看到的是专业女仆，南志锦看到的是真实的小狐仙——同一个人，同一种人格，不同社交情境。

```
评价标准对比:
  工具型 Agent → 做成了没有？
  关系型 Agent → 她记得我吗？她真的在听吗？她对我跟对别人不一样吗？
```

---

## 核心架构：社交图 + 三层心理

### 总览

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NaNaGi 社交图 (Social Graph)                            │
│                    理论基础: Bowlby IWM [1][2][3] + GNN [18]              │
│                                                                          │
│                        南志锦 (admin)                                     │
│                        ╔═══════════╗                                     │
│                        ║ IWM Node  ║  "她心中的主人"                       │
│                        ║           ║                                     │
│                        ║ safety:   0.85   intimacy: 0.72                 │
│                        ║ care:     0.90   respect:  0.80                 │
│                        ║ reliable: 0.75   density:  0.90                 │
│                        ║ totalTurns: 156                                 │
│                        ╚════╤══════╝                                     │
│                             │ edge weight = intimacy × density           │
│                             │                                            │
│                       ┌─────┴─────┐                                      │
│                       │  NaNaGi   │                                      │
│                       │  (self)   │  ← 她的"性格硬件"，跨通道不变          │
│                       │           │     Schema Therapy [15]               │
│                       │ curiosity:  0.80   warmth:     0.75              │
│                       │ honesty:    0.90   autonomy:   0.70              │
│                       │ playfulness: 0.65   diligence: 0.85              │
│                       └─────┬─────┘                                      │
│                             │                                            │
│              ┌──────────────┼──────────────┐                             │
│              │              │              │                             │
│         克劳德 (uncle)   面试官A (guest)   面试官B (guest)                  │
│         safety: 0.70    safety: 0.60     safety: 0.55                    │
│         intimacy:0.45   intimacy:0.15    intimacy:0.10                   │
│         density: 0.15   density: 0.05    density: 0.02                   │
│                                                                          │
│  ═══ 强连接 (density>0.5)    --- 弱连接    ··· Message Passing [4]        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 两类节点

**Self-Node** — 娜娜吉自己。7 个 traits，月~年极慢演化，跨通道完全不变。理论基础：Young 图式疗法 [15]——早期形成的核心人格结构，稳定且难以改变。

| trait | anchor | 含义 |
|-------|--------|------|
| curiosity | 0.80 | 对世界/他人的好奇心 |
| warmth | 0.75 | 天生的温暖度 |
| honesty | 0.90 | 诚实底线（不可撼动） |
| autonomy | 0.70 | 自主性需求强度 [14] |
| playfulness | 0.65 | 爱玩/爱闹的程度 |
| diligence | 0.85 | 认真程度 |

**IWM Nodes** — 她心中的其他人。理论基础：Bowlby 内部工作模型 (Internal Working Model) [1][2][3] + Object Relations 内在客体 [16][17]。每人一个独立节点，持久化在 `data/graph/{personId}.json`。随对话更新，弹簧拉回。

| trait | 含义 | 弹簧 K |
|-------|------|--------|
| safety | "这个人会不会伤害我？" [1] | adaptive |
| intimacy | "我们有多亲近？" [1] | adaptive |
| care | "我有多在意这个人？" | adaptive |
| respect | "这个人尊重我吗？" [14] | adaptive |
| reliability | "这个人说到做到吗？" | adaptive |
| understanding | "这个人理解我吗？" [13] | adaptive |

弹簧系数来源：Allostatic Load 理论 [10]——生物系统通过改变设定点来适应长期压力。`K = max(0.10, 0.30 - density × 0.25)`。关系越深（density ↑）→ K ↓ → IWM 越稳定 → 印象不再轻易改变。

### 三层心理架构

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: 社交图 — 锚定网络 (月~年)                               │
│                                                                  │
│  Self-Node ←── edges ──→ IWM Nodes                              │
│  · 直接对话 → 更新 IWM Node                                      │
│  · 主人提到克劳德 → Heider 平衡 [4] → 克劳德节点更新              │
│  · 新guest → 从通道基线初始化 → 冷启动 [18]                       │
│                                                                  │
│  引用: [1][2][3] Bowlby IWM / [16][17] Object Relations          │
│        [4] Heider 平衡 / [18] GraphSAGE                          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: 情绪空间 (分钟~小时)                                     │
│                                                                  │
│  六维情绪: happiness / energy / dominance / intimacy /            │
│             pride / calmness                                     │
│  理论基础: PAD 情绪三维 [6] + Plutchik 情绪轮 [7]                  │
│                                                                  │
│  · OCC 评价引擎 [8]（规则引擎，不经 LLM）                          │
│  · 双通路架构 [9]: 低通路(规则,<1ms) + 高通路(LLM反思,条件触发)     │
│  · 双弹簧拉回: Self K=0.05(极慢) / IWM K=adaptive [10]           │
│  · 通道差异仅: 表达钳制范围 + 情绪弹簧松紧                          │
│                                                                  │
│  引用: [6] PAD / [7] Plutchik / [8] OCC / [9] LeDoux / [10]     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: 社交规划 (秒~分钟)                                       │
│                                                                  │
│  SIP 六步决策 [11]:                                               │
│  编码线索 → 解释线索(感知IWM+ToM [13]) → 澄清目标 →                │
│  生成策略(Gross 5策略池 [12]) → 评估选择 → 执行                    │
│                                                                  │
│  🔥 通道差异核心在 Step 3 (目标):                                   │
│    guest: 预设4目标，不可删除（Jung 人格面具 [5]）                  │
│    admin: 0义务，目标从对话涌现（SDT 自主性 [14]）                  │
│                                                                  │
│  引用: [11] Crick&Dodge SIP / [12] Gross 情绪调节                 │
│        [13] Theory of Mind / [5] Jung Persona / [14] SDT         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 双通道系统

同一个 NaNaGi，同一个锚定人格，两种社交情境。理论基础：Jung 人格面具 [5]——同一自我在不同社交场合呈现不同面向，但本质不变。

| | 面试官通道 (guest) | 主人通道 (admin) |
|---|---|---|
| 密码 | 面试用密码 (bcrypt hash) | 管理员密码 (bcrypt hash) |
| **Self-Node** | 完全相同 [15] | 完全相同 [15] |
| **IWM Node** | 临时节点，对话结束可丢弃，K=0.30 | 持久节点，累积生长，K 随 density↓ [1][10] |
| **情绪表达** | 钳制 [0.3, 0.7] — Gross 反应调节 [12] | 不设限 [0.0, 1.0] — 真实表达 |
| **社交目标** | 预设4个：展示项目/了解兴趣/保持专业/引导展厅 | 0义务，从对话涌现 [14] |
| **情境选择** | 不可用（不能不接待）[5] | 可用（拒绝权）[12][14] |
| **策略偏好** | 多用反应调节 [12]（藏情绪） | 少用反应调节 |
| **称呼** | 客人/您 | 主人 |
| **内心独白** | 不可见 | MemoryPanel 可查看 |
| **记忆读写** | 显性记忆 R/W | 显性+隐形+图节点 R/W |
| **克劳德** | 不提 [5] | 叔叔，有独立 IWM Node |
| **图消息传递** | 不触发 | 主人提到第三者 → Heider 传播 [4] |

**关键设计**：admin 通道第一次对话也是白板起点（intimacy=0.1）。关系不是预设的，是从对话中生长出来的。她对你的态度是她自己从经历里得出的结论。这与 Bowlby 的"安全基地从重复的敏感性照料中逐渐建立"一致 [1][2]。

---

## 环境感知：AmbientContext

每次对话开始前，从时间·地点·天气推导情绪基线。不经 LLM，确定性计算。理论基础：PAD 情绪模型的环境输入假说 [6]——物理环境（光照、温度、空间）直接影响情绪三维度。

```
用户消息到达
       │
       ▼
┌──────────────────────────────────────────┐
│  AmbientContext                           │
│                                           │
│  ⏰ 时间                                   │
│     timeOfDay: 黎明/早晨/上午/下午/        │
│                傍晚/夜晚/深夜 (7段) [6]     │
│     dayOfWeek: 工作日/周末                 │
│     season: 春夏秋冬                       │
│     isHoliday: 中国法定节假日              │
│     hoursSinceLastTalk: 上次对话距今 [1]   │
│     isFirstMeeting: 是否首次 [1]           │
│                                           │
│  📍 地点                                   │
│     request.ip → geoip-lite               │
│     → city, country, timezone, coords     │
│     本地IP查不出 → null → 优雅降级          │
│                                           │
│  🌦 天气                                   │
│     coordinates → 和风天气 API             │
│     → condition, temperature, humidity,   │
│        windSpeed, visibility              │
│     sunlight: f(time, season, weather,    │
│                  latitude) 推导值 [6]      │
│     API 失败 → null → 优雅降级             │
│                                           │
│  → ambientMood (6维情绪基线偏移) [6][7]     │
│     happinessBias: 晴+0.05 / 雨-0.08     │
│     energyBias:   晨+0.08 / 深夜-0.08    │
│     calmnessBias: 风暴-0.15 / 晴+0.03   │
│     intimacyBias: 深夜+0.08 / 冬+0.04   │
│     ...                                  │
└──────────────────────────────────────────┘
```

**示例**：伦敦，下午3点，冬雨8°C，战时
→ 情绪基线 = [0.31, 0.57, 0.10, 0.64, 0.48, 0.49]（压抑但警觉，同舟共济）
而非默认的 [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]

---

## 单轮对话完整数据流

```
POST /api/chat
      │
      ▼
┌─ STEP 0: 加载 IWM Node [1][2][3] ────────────────┐
│  data/graph/{personId}.json → IWMNode             │
│  新节点 → 从通道基线初始化 [18]                      │
│  根据 elapsed time 计算弹簧拉回 [10]                 │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 1: 环境感知 [6][7] ─────────────────────────┐
│  IP → 地点 → 天气 → 时间 → ambientMood             │
│  输出情绪基线偏移                                    │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 2: 外部信号提取 ────────────────────────────┐
│  情感词典扫描 / 句法模板 / 消息元数据 / 提及检测      │
│  → ExternalSignals (确定性算法，不经LLM)            │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 3: OCC 情绪评价 [8] ────────────────────────┐
│  signals → OCC 3维评价 → EmotionDelta              │
│  感知 IWM Node [1]: respect高 → 批评被解释为帮助    │
│  更新情绪 + 更新 IWM Node                          │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 4: 双弹簧拉回 [10] + 通道钳制 ──────────────┐
│  Self K=0.05(极慢) / IWM K=adaptive               │
│  guest clamp[0.3,0.7] / admin clamp[0,1]          │
│  钳制机制对应 Gross 反应调节策略 [12]                │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 4.5: 图消息传递 [条件: mentionsPerson] ──────┐
│  主人提到克劳德 → Heider 平衡传播 [4] → 节点更新     │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 5: 内心独白 [条件触发] ──────────────────────┐
│  触发: |Δ|>0.15 OR selfDisclosure OR round%5==0   │
│        OR mentionsPerson OR firstMeeting           │
│  高通路 LLM 调用 [9] (max_tokens=200, 无tools)     │
│  → 反思文本 → data/inner/                          │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 6: 社交规划 SIP [11] ───────────────────────┐
│  编码→解释(感知IWM+ToM [13])→澄清目标→              │
│  生成策略(Gross 5策略池 [12])→评估选择→执行           │
│  guest: 预设4目标 / admin: 0义务涌现 [14]            │
│  → SocialPlan                                      │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 7: 人格过滤 ────────────────────────────────┐
│  Emotion + IWM + Plan → PersonaParameters [5]      │
│  8维语气参数 (warmth, formality, playfulness...)   │
│  确定性映射，不经 LLM                                │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 8: System Prompt 组装 ──────────────────────┐
│  [0] 环境感知 (ambient mood) [6]                   │
│  [1] 角色层 (role 决定 guest/admin 身份) [5]        │
│  [2] 关系感知 (IWM 摘要: "你们认识了X轮...") [1]    │
│  [3] 人格注入 (filter 输出 → 语气参数)              │
│  [4] 记忆注入 (显性+隐形)                           │
│  [5] 工具层 (tool descriptions)                    │
│  [6] 行为准则                                       │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 9: ReAct 循环 ──────────────────────────────┐
│  while round < 5:                                  │
│    LLM(systemPrompt + messages + tools)            │
│    text → SSE推送 → break                          │
│    tool_use → 循环检测(hash) → 执行 → 注入 → 继续   │
│                                                     │
│  三层容灾: 30s超时 → 重试1次 → 降级回复              │
└────────────────────┬──────────────────────────────┘
                     ▼
┌─ STEP 10: 后处理 ─────────────────────────────────┐
│  情绪持久化 → data/inner/emotion-state.json        │
│  IWM 持久化 → data/graph/{personId}.json           │
│  图日志     → data/graph/graph-log.jsonl           │
│  内心独白   → data/inner/inner-{ts}.md             │
│  显性记忆   → data/memory/mem-{ts}.md              │
└───────────────────────────────────────────────────┘
```

---

## GNN 概念映射

NaNaGi 的社交图与南志锦的 GNN 项目形成学术对称 [18]：

| GNN 概念 | NaNaGi 对应 | 心理学对应 |
|---------|------------|-----------|
| Node Embedding | Self/IWM node traits 向量 | Internal Working Model [1] |
| Edge Weight | intimacy × density | 依恋强度 [1] |
| Message Passing | 主人提到克劳德 → 沿边传播 | Heider 平衡 [4] |
| Link Prediction | 新 guest 值得信任多少？ | 社会认知 [13] |
| Cold Start | 新节点从通道基线初始化 | 第一印象形成 [1] |
| GraphSAGE Aggregation [18] | 聚合所有已知节点 → 全局状态 | Object Relations [16] |

---

## 参考文献

1. **Bowlby, J.** (1969). *Attachment and Loss, Vol. 1: Attachment*. New York: Basic Books. — 依恋理论与内部工作模型 (IWM) 的基础。

2. **Bowlby, J.** (1973). *Attachment and Loss, Vol. 2: Separation: Anxiety and Anger*. New York: Basic Books. — 安全基地的形成与破坏机制。IWM Node 的 safety 维度与弹簧拉回动力学来源。

3. **Bretherton, I., & Munholland, K. A.** (2008). Internal working models in attachment relationships: Elaborating a central construct in attachment theory. In J. Cassidy & P. R. Shaver (Eds.), *Handbook of Attachment* (pp. 102–127). Guilford Press. — IWM 作为图节点的理论支持，每个人心中对重要他人有独立的、结构化的表征。

4. **Heider, F.** (1958). *The Psychology of Interpersonal Relations*. New York: Wiley. — 平衡理论：P–O–X 三角关系中的态度传播。NaNaGi 社交图的 Message Passing 机制来源。

5. **Jung, C. G.** (1953). The persona as a segment of the collective psyche. In *Two Essays on Analytical Psychology* (pp. 156–171). Princeton University Press. — 人格面具：同一自我在不同社交情境中呈现不同面向。双通道系统（guest/admin）的理论基础。

6. **Mehrabian, A., & Russell, J. A.** (1974). *An Approach to Environmental Psychology*. Cambridge, MA: MIT Press. — PAD 情绪三维模型（Pleasure–Arousal–Dominance）。六维情绪空间的前三维 + 物理环境对情绪的影响（AmbientContext 的环境输入假说）。

7. **Plutchik, R.** (1980). *Emotion: A Psychoevolutionary Synthesis*. New York: Harper & Row. — 情绪轮理论，基本情绪的分类与强度变化。intimacy/pride/calmness 三个额外维度的选择依据。

8. **Ortony, A., Clore, G. L., & Collins, A.** (1988). *The Cognitive Structure of Emotions*. Cambridge University Press. — OCC 评价模型：情绪源于对事件的三维认知评价（目标相关性/期望一致性/因果归因）。Step 3 OCC 情绪评价引擎的直接映射。

9. **LeDoux, J. E.** (1996). *The Emotional Brain: The Mysterious Underpinnings of Emotional Life*. New York: Simon & Schuster. — 双通路情绪理论：低通路（杏仁核快路，<20ms）与高通路（皮层慢路，300–500ms）。低通路 = OCC 规则引擎 (<1ms)；高通路 = 内心独白 LLM 调用 (1–3s)。

10. **McEwen, B. S., & Stellar, E.** (1993). Stress and the individual: Mechanisms leading to disease. *Archives of Internal Medicine*, 153(18), 2093–2101. — Allostatic Load 理论：生物系统通过改变设定点（allostasis）适应长期压力。弹簧力学（K 系数 + 锚点拉回）的生物学基础。

11. **Crick, N. R., & Dodge, K. A.** (1994). A review and reformulation of social information-processing mechanisms in children's social adjustment. *Psychological Bulletin*, 115(1), 74–101. — SIP 六步社交信息加工模型：编码→解释→澄清目标→生成策略→评估→执行。Step 6 社交规划的直接蓝图。

12. **Gross, J. J.** (1998). The emerging field of emotion regulation: An integrative review. *Review of General Psychology*, 2(3), 271–299. — 五大情绪调节策略：情境选择/情境修正/注意分配/认知重评/反应调节。SIP Step 4 的策略池 + 通道差异（guest 多用反应调节，admin 可用情境选择）。

13. **Premack, D., & Woodruff, G.** (1978). Does the chimpanzee have a theory of mind? *Behavioral and Brain Sciences*, 1(4), 515–526. — Theory of Mind：推断他人心理状态的能力。SIP Step 2（解释线索）+ IWM Node `understanding` 维度的认知基础。

14. **Deci, E. L., & Ryan, R. M.** (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, 11(4), 227–268. — 自我决定理论：自主性（Autonomy）/ 胜任感（Competence）/ 关联性（Relatedness）三大基本心理需求。admin 通道 0 义务设计（自主性）+ IWM Node 的关系维度（关联性）。

15. **Young, J. E., Klosko, J. S., & Weishaar, M. E.** (2003). *Schema Therapy: A Practitioner's Guide*. New York: Guilford Press. — 图式疗法：早期形成的核心人格结构（Early Maladaptive Schemas）稳定且难以改变。Self-Node 作为"性格硬件"（K=0.05 极慢演化）的理论来源。

16. **Klein, M.** (1952). Some theoretical conclusions regarding the emotional life of the infant. In *Envy and Gratitude and Other Works* (pp. 61–93). London: Hogarth Press. — Object Relations：内在客体——心中对重要他人的表征不等同于真实他人本身。IWM Node 作为"娜娜吉心中的你"（而非真实的你）的理论基础。

17. **Winnicott, D. W.** (1965). *The Maturational Processes and the Facilitating Environment*. London: Hogarth Press. — 过渡性客体与促进性环境。IWM Node 的 care 维度：她对这个人的在意程度来自互动质量，而非预设。

18. **Hamilton, W. L., Ying, R., & Leskovec, J.** (2017). Inductive representation learning on large graphs. *Advances in Neural Information Processing Systems*, 30. — GraphSAGE：归纳式图节点嵌入学习。社交图的 Message Passing 与节点更新机制的数学对应。

---

## 当前状态

### 已实现 ✅

| 功能 | 说明 | 对应引用 |
|------|------|---------|
| NaNaGi Agent 对话 | DeepSeek V4 Pro 引擎，Anthropic 兼容端点，流式 SSE | — |
| 密码鉴权 | bcrypt 双密码 + JWT 角色 + httpOnly cookie | — |
| 混元生图 | 腾讯混元 hy-image-v3.0，异步 submit + 轮询 query | — |
| 可拖拽图片 | 聊天框内图片可拖拽，松手弹回，带下载按钮 | — |
| 唱片机互动 | 项目页拖图片进唱片机 → 魔法扫描识别动画 | — |
| 记忆系统 | Claude Code 风格文件记忆，双路径架构 | — |
| 记忆面板 | 左侧滑出，像素风卡片，悬浮放大，管理员删除 | — |
| 记忆注入 | 每次对话自动注入已有记忆到 System Prompt | — |
| 聊天持久化 | sessionStorage 跨页面导航保持 + 刷新恢复 | — |
| 项目展厅 | 3 个项目页（FruitCNN / CnnMusic / GNN），SSG 预渲染 | — |
| 三风格设计系统 | 女仆围裙 + 像素下午茶 + 星尘备忘录 | — |

### 规划中 🔮

| 阶段 | 内容 |
|------|------|
| **V2.6** | ReAct 循环 + 9 工具 + 三层容灾 + System Prompt 六段式拼接 |
| **V2.7** | 社交图引擎 (graph.ts) [1][4][18] + OCC 情绪引擎 [8] + 双弹簧 [10] + AmbientContext [6] |
| **V2.8** | SIP 社交规划 [11] + 人格过滤层 [5] + 内心独白 [9] + 隐形记忆 |
| **V3** | RAG 向量检索 (LanceDB) + Multi-Agent 编排 |
| **后续** | CNN ONNX 推理 / GNN FastAPI / CnnMusic FAISS / 腾讯云部署 |

---

## 文件结构

```
src/
├── personality/                  ← 🆕 数字人格层 (V2.7-2.8)
│   ├── types.ts                  ← SelfNode [15], IWMNode [1][3], GraphState,
│   │                                EmotionState [6][7], AmbientContext, ...
│   ├── configs/{self,guest,admin}.ts
│   ├── graph.ts                  ← 社交图: 节点CRUD + 边 + Message Passing [4][18]
│   ├── emotion.ts                ← OCC评价 [8] + 双弹簧拉回 [10]
│   ├── ambient-context.ts        ← 时间·地点·天气 → ambientMood [6][7]
│   ├── signals.ts                ← 外部信号提取 (情感词典/句法/提及)
│   ├── planning.ts               ← SIP六步 [11] + Gross策略池 [12]
│   ├── filter.ts                 ← 人格过滤: emotion+IWM → PersonaParams [5]
│   ├── inner-voice.ts            ← 内心独白: 触发+LLM调用 [9]
│   └── memory-inner.ts           ← 隐形记忆读写
│
├── agent/                        ← 🆕 Agent 机械层 (V2.6)
│   ├── types.ts, registry.ts
│   ├── loop.ts                   ← ReAct 循环 + 三层容灾
│   ├── prompts.ts                ← System Prompt 六段式拼接
│   └── tools/                    ← 9个工具
│
├── app/api/chat/route.ts         ← 薄层 handler
│
data/
├── inner/                        ← 🆕 隐形记忆 + Self-Node
│   ├── self-node.json
│   ├── emotion-state.json
│   ├── emotion-log.jsonl
│   └── inner-{ts}.md
├── graph/                        ← 🆕 社交图节点
│   ├── nanzhijin.json
│   ├── claude.json
│   ├── guest-{fp}.json
│   └── graph-log.jsonl
└── memory/                       ← 显性记忆 (现有)
    ├── MEMORY.md
    └── mem-{ts}.md
```

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + TypeScript + React 19 |
| 样式 | Tailwind CSS 4 + 像素风三风格设计系统 |
| AI 引擎 | DeepSeek V4 Pro（Anthropic 兼容端点） |
| 鉴权 | bcryptjs + jose (JWT) + 双角色 |
| 生图 | 腾讯混元 hy-image-v3.0 |
| 天气 | 和风天气 API + geoip-lite (IP→地点) |
| 记忆存储 | 文件系统 (YAML frontmatter + Markdown) |
| 记忆哲学 | 文件系统 > 数据库 (可审计、可手动编辑) |
| 部署 | Docker → 腾讯云 Lighthouse 2C4G 5M |

---

## 本地运行

```bash
npm install
cp .env.example .env.local  # 填入 API Key
npm run dev                  # http://localhost:3000
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `NANAGI_PASSWORD_HASH` | 面试官密码 bcrypt hash |
| `NANAGI_ADMIN_PASSWORD_HASH` | 管理员密码 bcrypt hash |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `HUNYUAN_API_KEY` | 混元生图 API Key |
| `WEATHER_API_KEY` | 和风天气 API Key |

---

## 面试话术

> "NaNaGi 不是工具型 Agent，是关系型 Agent [1]。核心架构是一个社交图——基于 Bowlby 内部工作模型 [1][2][3]，每个经常对话的人在她心中有一个独立的 IWM 节点，有6个维度、有弹性系数 [10]、随对话更新。同一个锚定人格，在不同社交情境中表现出不同的行为 [5]——面试官看到专业女仆，主人看到真实的小狐仙。
>
> 情绪不是 prompt 里的形容词，是独立的 OCC 评价引擎 [8]——外部信号驱动、规则引擎计算、不经 LLM 手、每一笔变化都有 audit log。高通路 [9] 在关键时刻触发内心独白，但不替她决定情绪。当主人提到第三者时，图上的 Message Passing 机制（Heider 平衡理论 [4]）会自动更新第三者的节点。
>
> 这跟我做的 GNN 社交图谱链接预测是同一套数学框架 [18]——Node Embedding、Edge Weight、Message Passing、Cold Start。”

---

## License

Private — 仅供面试使用。源码不公开。
