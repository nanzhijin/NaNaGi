# LLM 面试盲区专题 — 补 Happy-LLM 未覆盖的深度考点

> **定位**：Happy-LLM 覆盖了 Transformer 基础（Attention/QKV/Multi-Head/Encoder-Decoder），但面试不会只问这些。
> 本文档补的是**面试真正会深挖的方向**——对齐训练、推理优化、Agent 架构、RAG、部署、评估。
> 每个专题按 **必问程度** 分级：🔴 高频必考 → 🟡 常见 → 🟢 进阶加分。

---

## 目录

1. [对齐训练：RLHF / DPO / PPO](#1-对齐训练rlhf--dpo--ppo)
2. [推理优化：KV Cache / Flash Attention](#2-推理优化kv-cache--flash-attention)
3. [模型压缩与部署：量化 / LoRA / 推理框架](#3-模型压缩与部署量化--lora--推理框架)
4. [MoE 混合专家架构](#4-moe-混合专家架构)
5. [RAG 深度：分块 / 检索 / 重排 / 评估](#5-rag-深度分块--检索--重排--评估)
6. [Agent 架构深度：ReAct / Tool Use / Multi-Agent / Harness](#6-agent-架构深度react--tool-use--multi-agent--harness)
7. [LLM 评估体系](#7-llm-评估体系)
8. [幻觉：成因与缓解](#8-幻觉成因与缓解)
9. [长上下文技术](#9-长上下文技术)
10. [Prompt Engineering 进阶](#10-prompt-engineering-进阶)
11. [面试叙事：如何用 NaNaGi 反向碾压](#11-面试叙事如何用-nanagi-反向碾压)

---

## 1. 对齐训练：RLHF / DPO / PPO 🔴🔴🔴

### Q1: RLHF 的三阶段流程是什么？

```
阶段1: SFT (Supervised Fine-Tuning)
  → 人工写高质量 (prompt, response) 对
  → 在基座模型上做监督微调
  → 产出: SFT Model

阶段2: RM (Reward Model) 训练
  → 对同一个 prompt，SFT Model 生成多个 response
  → 人工排序 (A > B > C > D)
  → 训练 Reward Model 学会打分
  → 产出: RM (通常和 SFT Model 同架构，换输出头)

阶段3: PPO 强化学习
  → SFT Model = Policy
  → RM = Reward signal
  → 用 PPO 更新 Policy，最大化 RM 打出的分数
  → 加 KL 惩罚项：防止 Policy 偏离 SFT Model 太远（否则会 hack RM）
  → 产出: RLHF Model
```

**面试要点**：能画出三阶段图 + 解释 KL 惩罚为什么必要（防止 reward hacking）。

### Q2: PPO 在 RLHF 里具体怎么用？四个核心组件？

```
1. Policy Model (π_θ): 就是 SFT Model，要优化的对象
2. Reference Model (π_ref): 冻结的 SFT Model，用于计算 KL 惩罚
3. Reward Model (r_φ): 对生成的 response 打分
4. Value Model (V_ψ): 估计当前状态的期望回报（PPO 的 Critic）

优化目标:
max E[ r(x,y) - β·KL(π_θ(y|x) || π_ref(y|x)) ]
     └─奖励越大越好─┘ └─但不能偏离太远──┘

β 控制 KL 惩罚的强度（InstructGPT 的 β ≈ 0.02）
```

### Q3: DPO 是什么？为什么比 RLHF 简单？🔴

```
DPO (Direct Preference Optimization) — 2023, Stanford

核心思想: 不需要单独训练 Reward Model，直接把偏好数据作为训练目标。

RLHF 的问题:
  - 需要训练独立的 RM（额外 GPU + 训练不稳定）
  - PPO 训练复杂（需要 4 个模型同时加载）
  - RM 只是偏好的代理，不是真实目标

DPO 的做法:
  - 将 RLHF 的优化目标等价变换为二分类损失
  - 直接最大化 "chosen response 比 rejected response 好的概率"
  - 只需: Policy Model + Reference Model（2 个模型，不用 RM 和 Critic）

DPO 损失函数 (简化):
L_DPO = -E[ log σ( β·log(π_θ(y_w|x)/π_ref(y_w|x)) - β·log(π_θ(y_l|x)/π_ref(y_l|x)) ) ]
        └─────────────── chosen 的相对概率 ───────┘   └──────── rejected 的相对概率 ───┘

一句话: DPO 让 chosen 的概率相对 rejected 尽量大，同时 reference model 做锚定防止跑偏。
```

**面试对比话术**：
| | RLHF | DPO |
|---|------|-----|
| 需要训练 RM | ✅ 需要 | ❌ 不需要 |
| GPU 需求 | 4 模型同载 | 2 模型 |
| 训练稳定性 | PPO 敏感 | 直接梯度下降 |
| 数据需求 | 偏好排序 | 偏好对 (chosen, rejected) |
| 性能 | 上限可能更高 | 接近 RLHF，更简单 |

### Q4: Reward Hacking 是什么？怎么防？

```
Reward Hacking = Policy 学会了"骗" Reward Model，而不是真正变好

例子:
  - RM 对长文本打分偏高 → Policy 开始无意义地啰嗦
  - RM 对"礼貌用语"打分偏高 → Policy 每句都加 "Thank you for your question"

防御:
  1. KL 惩罚（最核心）：不偏离 SFT Model 太远
  2. RM 对抗训练：定期用 Policy 的输出来更新 RM
  3. 多 RM 集成：不同 RM 取均值/最小值
  4. 人工抽查：定期 check Policy 的实际输出质量
```

**NaNaGi 关联**：NaNaGi 不需要 RLHF——她的"对齐"不是迎合人类偏好，而是保持人格一致性。这反而更接近论文 Governance 层的"声明式章程"——人格定义作为顶层约束。

---

## 2. 推理优化：KV Cache / Flash Attention 🔴🔴

### Q1: KV Cache 是什么？为什么自回归需要它？🔴

```
自回归生成: 每生成一个 token，都要重新算所有之前 token 的 Attention。

如果不用 KV Cache:
  生成第 t 个 token → 对所有 t-1 个历史 token 重新算 K 和 V → O(t²)

KV Cache 原理:
  - 每算出一个新 token，把它的 K, V 存起来
  - 下一次只算新 token 的 Q，和历史 K, V 矩阵做 Attention
  - K, V 只算一次，复用
  
  第一次: Q₁K₁^T → 存 K₁, V₁
  第二次: Q₂[K₁;K₂]^T → 存 K₂, V₂ (K₁,V₁ 复用)
  第三次: Q₃[K₁;K₂;K₃]^T → ...

复杂度: O(t²) → O(t)（每个新 token 只需和历史的做一次矩阵乘法）

内存占用:
  KV Cache 大小 = 2 × layers × batch × heads × seq_len × head_dim × dtype_size
  例: LLaMA-7B, 32层, 1batch, 32head, 2048seq, 128dim, FP16
  = 2 × 32 × 1 × 32 × 2048 × 128 × 2 bytes ≈ 1GB
```

### Q2: Flash Attention 解决了什么问题？🔴

```
标准 Attention 的问题: 内存墙 (Memory Wall)

QK^T → softmax → ×V 的过程中：
  - 需要把完整的 N×N attention matrix 写入 HBM（GPU 显存）
  - N=2048 → 4M 元素 → FP16: 8MB（可接受）
  - N=8192 → 64M 元素 → 128MB（开始痛）
  - N=32K → 1B 元素 → 2GB（爆炸）

Flash Attention 的核心思想: Tiling + Recomputation

1. Tiling (分块):
   - 把 Q, K, V 切成小块
   - 在 SRAM (GPU 片上, 快 10-20 倍) 里逐块算
   - 只把最终结果写回 HBM
   - 永远不显式构造完整的 N×N attention matrix

2. Recomputation (重算):
   - 反向传播时不存 attention matrix
   - 需要时从 Q, K, V 快速重算

效果:
  - 显存: O(N²) → O(N)（线性）
  - 速度: 2-8× 加速
  - 长序列: 从不可训变为可训
```

**面试对比**：
| | 标准 Attention | Flash Attention |
|---|---------------|----------------|
| 显存 | O(N²) | O(N) |
| 瓶颈 | HBM 带宽 | 计算 bound |
| 精度 | 标准 | 数值等价（不是近似） |
| 长序列 | N>4K 就痛 | N=64K 可跑 |

### Q3: Multi-Query Attention (MQA) 和 Grouped-Query Attention (GQA) 的区别？

```
标准 Multi-Head Attention:
  每个 head 有独立的 Q, K, V → 推理时 KV Cache 很大

MQA (Multi-Query Attention):
  所有 head 共享同一份 K, V → KV Cache 缩小 head 倍
  代价: 质量轻微下降

GQA (Grouped-Query Attention) — LLaMA 2/3 采用:
  N 个 head 分成 G 组，组内共享 K, V
  G=1 → 退化为 MQA；G=N → 退化为标准 MHA
  取中间值 (如 G=8, N=32) → 平衡质量和速度
```

---

## 3. 模型压缩与部署：量化 / LoRA / 推理框架 🟡🟡

### Q1: INT8/INT4 量化的原理？PTQ vs QAT？

```
量化 = 把 FP16/FP32 的模型参数和激活值映射到低精度整数

对称量化: 
  q = round(x / s)   其中 s = max(|x|) / (2^{bits-1} - 1)
  x̂ = q × s

非对称量化:
  q = round((x - z) / s)
  x̂ = q × s + z
  z = zero point (处理偏态分布)

PTQ (Post-Training Quantization):
  - 训练完再量化，不需要重训
  - GPTQ / AWQ 属于此类
  - 可能掉点（尤其小模型）

QAT (Quantization-Aware Training):
  - 训练中模拟量化误差
  - 精度更高，但需要重训
  - 大模型通常不现实
```

### Q2: GPTQ 和 AWQ 的区别？

```
GPTQ (2023):
  - 逐层量化，用 Hessian 矩阵的逆补偿量化误差
  - 需要少量校准数据（128 条即可）
  - 速度较慢（大模型需要几小时）

AWQ (Activation-Aware Weight Quantization, 2023):
  - 核心发现：不是所有权重同等重要
  - 大激活值对应的权重更重要 → 保留高精度
  - 按激活值大小做 per-channel scaling
  - 比 GPTQ 快 10×，质量相当
```

**面试加分点**：能说出 "AWQ 的核心 insight 是 saliency-aware — 1% 的重要权重保护好了，99% 的低精度影响不大"。

### Q3: LoRA 的原理？为什么能做到参数高效？🔴

```
LoRA (Low-Rank Adaptation) — Microsoft, 2021

核心假设: 大模型微调时的权重更新 ΔW 是低秩的 (low-rank)

做法:
  - 冻结原始权重 W
  - 在每个 target 层旁路加两个小矩阵 A (d×r) 和 B (r×d)
  - ΔW = A·B，r << d（r 通常 8~64）
  - 推理时 W' = W + A·B，可融合，无推理成本

参数对比:
  GPT-3 175B: 全量微调 175B 参数
  LoRA: 只训 A 和 B，约 0.1-1% 的参数量

变体:
  - QLoRA: LoRA + 4bit 量化基座 → 单卡 48GB 可微调 65B 模型
  - DoRA: 分解 magnitude 和 direction 分别学

面试要点: 
  "为什么低秩假设成立？" → 预训练已经学到了好的表示空间，微调只需要小幅度调整
```

### Q4: 主流推理框架对比

```
vLLM:
  - PagedAttention: 把 KV Cache 像 OS 的虚拟内存一样分页管理
  - 碎片率从 20-40% → < 4%
  - Continuous batching: 请求不等 batch，来一个处理一个
  - 吞吐: 比 HF Transformers 高 24×

TensorRT-LLM:
  - NVIDIA 官方，最强优化（kernel 级别）
  - 支持 GPTQ/AWQ/FP8 量化
  - In-flight batching
  - 上手门槛较高

llama.cpp:
  - CPU 推理（GGUF 格式量化）
  - 消费级硬件跑 70B 模型
  - 适合本地部署

Ollama:
  - 基于 llama.cpp 的友好封装
  - 一键部署各种开源模型
```

---

## 4. MoE 混合专家架构 🟡🟡

### Q1: MoE 的核心思想？为什么 DeepSeek 用这个架构？

```
MoE (Mixture of Experts):

传统 Dense Model: 每个 token 激活全部参数
MoE: 每个 token 只激活一小部分"专家" (expert)

结构:
  - 多个 FFN "专家"（如 8/16/64 个）
  - Router/Gate: 对每个 token 选 top-k 个专家
  - 最终输出 = Σ(router_weight_i × expert_i(token))

核心优势:
  - 总参数量大，但每 token 激活参数量可控
  - DeepSeek-V2: 236B 总参数，每 token 只激活 21B
  - 训练效率：同样的算力，更大的模型容量

关键挑战:
  - Load Balancing: 专家容易形成"马太效应"→ 热门专家过载，冷门闲置
  - 解决方案: auxiliary loss（负载均衡损失）+ expert capacity limit
  - 通信开销: 专家通常分布在不同 GPU → all-to-all 通信

DeepSeek 的创新:
  - DeepSeekMoE: 细粒度专家 + 共享专家隔离
  - 部分专家处理通用知识（共享），部分处理特定领域（路由）
  - Multi-Token Prediction: 训练时同时预测多个未来 token，提升效率
```

**NaNaGi 关联**：如果 NaNaGi 以后做 Multi-Persona 扩展，MoE 的 Router 逻辑可以类比 Persona Switch — 不同对话场景激活不同的人格表达专家。

---

## 5. RAG 深度：分块 / 检索 / 重排 / 评估 🟡🟡

### Q1: RAG 的完整流程？每步有哪些技术选型？

```
完整 7 步管线:

1. 文档加载 (Loader)
   PDF/HTML/Markdown/数据库 → 纯文本

2. 文本分块 (Chunking) 🔴
   - Fixed-size: 512 tokens, overlap 50（最常用，简单稳定）
   - Semantic: 按段落/句子边界分（spaCy/NLTK）
   - Recursive: LangChain RecursiveCharacterTextSplitter
   - 关键参数: chunk_size（太小丢上下文，太大检索不准）, overlap（防边界截断）
   
3. Embedding
   - text-embedding-3-small/large (OpenAI)
   - bge-large-zh (BAAI, 中文推荐)
   - Jina embeddings (8K 长文本)

4. 向量存储
   - Milvus/Qdrant (生产) / Chroma/FAISS (原型) / LanceDB (NaNaGi 选型)
   
5. 检索 (Retrieval)
   - 基础: 向量相似度 (cosine/L2)
   - 混合检索: 向量 + BM25 关键词（互补）
   - 父文档检索: 检索小块 → 返回大块上下文
   
6. 重排序 (Re-ranking)
   - Cross-encoder: bge-reranker / Cohere Rerank
   - 对 top-k 结果做精细排序 → 提升 precision
   - 代价: 多一次 LLM/Encoder 调用
   
7. 生成 (Generation)
   - System Prompt + Retrieved Context + User Query → LLM
   - 引用标注: 要求 LLM 标注信息来源
```

### Q2: RAG 常见问题怎么解决？

```
问题 1: 检索不准 (低 recall)
  → 混合检索（向量+关键词）
  → Query 改写：用 LLM 先澄清/分解用户问题
  → HyDE: 先让 LLM 生成假设答案，再用假设答案去检索

问题 2: 检到了但用错了 (低 precision)
  → Re-ranking 重排
  → 相关性阈值过滤（低于阈值的文档不喂给 LLM）

问题 3: 回答与检索内容矛盾
  → 强制引用格式
  → LLM-as-Judge 事后检查

问题 4: 多跳推理 (需要综合多个文档)
  → 迭代检索：第一次检索 → 生成 → 发现信息缺口 → 第二次检索
  → 知识图谱 + 向量混合
```

### Q3: NaNaGi 的记忆系统 vs 标准 RAG 的区别？

```
标准 RAG:       用户问题 → 检索文档库 → 找到相关 → 生成回答
NaNaGi 记忆:    用户说话 → 你是谁？我们的关系？上次什么样？ 
               → 角色注入 + IWM 摘要 + 显性记忆 + 环境感知
               → 不同的人看到不同的 "RAG 结果"

差异:
  1. 检索源不同: RAG=文档，NaNaGi=IWM+记忆+环境
  2. 权限不同: RAG 无，NaNaGi=guest 不能搜主人记忆
  3. 三维加权: RAG 无，NaNaGi=recency(0.4)+keyword(0.35)+semantic(0.15)+relation(0.10)
  4. 腐化防御: RAG 无，NaNaGi=stale 标记自动降权
```

---

## 6. Agent 架构深度：ReAct / Tool Use / Multi-Agent / Harness 🔴🔴🔴

### Q1: ReAct 模式是什么？为什么比纯 CoT 好？🔴

```
ReAct = Reasoning + Acting（推理和行动交替）

纯 CoT (Chain-of-Thought):
  "我需要先查天气，然后..." → 模型在脑子里想，不能真的查

ReAct:
  Thought: "我需要知道今天的天气"
  Action: call get_weather()
  Observation: "北京今天 30°C"
  Thought: "30°C 很热，建议少穿"
  Action: 回复用户

为什么更好:
  1. 事实接地: 外部工具提供真实信息，不是模型"编"的
  2. 错误恢复: 工具调用失败 → 换策略，而不是一条路走到黑
  3. 可审计: 每一步 Action/Observation 可追溯
  4. 论文数据: ReAct 在 HotpotQA 上比 CoT 高 6-10 个点，幻觉减半
```

### Q2: Function Calling 的工程实现？Tool Schema 怎么设计？🔴

```
Tool Definition (Anthropic/OpenAI 标准):

{
  "name": "get_weather",              // 唯一标识
  "description": "查指定城市的天气",    // 模型靠这个判断何时调
  "input_schema": {                   // JSON Schema
    "type": "object",
    "properties": {
      "city": {
        "type": "string",
        "description": "城市名，如'北京'"
      }
    },
    "required": ["city"]
  }
}

设计原则 (来自 ENGINEERING_FRAMEWORK 的 "少而精"):
  1. description 是对模型的 "唯一文档" — 写清楚什么时候用、什么时候不用
  2. 参数尽量少，给默认值
  3. 错误返回要有结构化 message，模型能据此重试
  4. 区分 "失败"(网络超时) 和 "空结果"(查无此人)

循环控制:
  while round < MAX_ROUNDS:
    response = callLLM(messages, tools)
    if response is text → push to user, break
    if response is tool_use → execute → inject result → continue
    
  Hash 循环检测: 同一组 tool_use args 重复 → 卡死 → 降级回复
```

### Q3: Multi-Agent 的常见模式？什么时候需要？🟡

```
常见模式:

1. Planner → Generator → Evaluator（最经典）
   Planner 拆任务 → Generator 执行 → Evaluator 检查质量
   例子: 代码生成

2. Debate (对抗)
   两个 Agent 就某个结论辩论 → 暴露盲点
   例子: 安全审查、逻辑验证

3. Hierarchical (分层)
   Manager Agent 分配子任务给 Worker Agents
   例子: SWE-Agent

4. Ensemble (投票)
   多个 Agent 独立处理 → 投票/取最佳
   例子: 质量控制

什么时候需要 Multi-Agent:
  - 单 Agent 上下文窗口不够（拆分）
  - 需要对抗验证（安全/质量）
  - 任务异构（检索 + 推理 + 执行各司其职）

什么时候不需要:
  - 简单对话（NaNaGi 场景）→ 单 Agent + 内心独白 够了
  - 论文发现: L 层 Multi-Agent 已过度工程化，多数场景单 Agent 足够
```

### Q4: Agent Harness Engineering (ETCLOVG) 是什么？🔴🔴 — 面试大招

```
这是 2026 年最核心的 Agent 工程框架。如果能流畅讲出 ETCLOVG 七层，
面试官会知道你不是只会调 ChatGPT API。

公式: Agent = LLM + Harness Engineering

七层:
  E: 执行环境 — Agent 在哪跑、沙箱安全
  T: 工具接口 — 工具描述/发现/调用协议
  C: 上下文记忆 — 短期窗口/中期会话/长期记忆
  L: 生命周期 — 单Agent循环/多Agent编排
  O: 可观测性 — 调用追踪/成本/故障定位 ← 行业最弱
  V: 验证评估 — 轨迹级判断，不看最终得分看路径
  G: 治理安全 — 权限/审计/四拦截点(H1-H4)

核心数据点:
  - 不改模型只改 Harness → 编码基准 10× 提升
  - GPT-5.2-Codex: 52.8% → 66.5%（只改 system prompt + 自校验 hooks）
  - Meta-Harness: 76.4%（自动优化，超过所有手工方案）

NaNaGi 的适配: 我做了根本性适配——
  标准框架给"做事型 Agent"用，验证=Lint/Test，治理=权限检查。
  NaNaGi 是"认人型 Agent"，我重新定义为:
    Persona Engineering / Relationship Engineering / Social Harness Engineering
  并且按七层逐一设计，目前总分 4.4/10，O 和 V 是最大短板在补。
```

**面试亮点**：你能说出 "论文扫描了 170+ 开源项目，O 和 G 是行业共同短板"，以及 "Context Governor 中央调度器解决论文最大 open problem (Harness 耦合)"——这超出了 99% 的候选人。

---

## 7. LLM 评估体系 🟡🟡

### Q1: 怎么评估一个 LLM 好不好？有哪些维度？

```
维度                    方法                       局限
─────────────────────────────────────────────────────────
知识/推理    MMLU, GSM8K, HumanEval       刷题风险，不代表真实能力
对话质量    Chatbot Arena (ELO)           人偏好 ≠ 真实质量
安全性      Attack success rate            攻击手段永远在进化
幻觉率      TruthfulQA, HaluEval           幻觉定义本身就有争议
效率        Tokens/s, TTFT, 成本/token    和任务难度相关
对齐度      AlpacaEval, MT-Bench           GPT-4 做裁判的偏见

关键教训: 
  论文 V 层核心发现——相同通过率背后可能是完全不同的系统质量。
  一个靠暴力重试（高成本），一个钻了测试漏洞（不合规），
  一个碰巧对了（不稳定）→ 只看最终得分不够，要看轨迹。
```

### Q2: LLM-as-Judge 靠谱吗？有什么偏误？

```
常见的 LLM-as-Judge 偏误:

1. Position Bias (位置偏误): 倾向于选第一个/最后一个
   → 双次评估换顺序取平均

2. Verbosity Bias (冗长偏误): 长回复分更高
   → 控制长度，或在 prompt 里强调简洁

3. Self-Enhancement Bias: GPT-4 倾向于给 GPT 系打高分
   → 用不同模型家族的做 Judge

4. Order Effect: pair-wise 比较时，A vs B 和 B vs A 结果不一致
   → 双向比较

NaNaGi 的做法 (Verification 层):
  规则引擎确定性检查 (不经 LLM) + LLM-as-Judge 异步打分
  确定性规则: 禁词检测、intimacy<0.3 但过于亲密 → 直接标记
  LLM 打分: 温暖度/一致性/恰当性 → 异步，不阻塞对话
```

---

## 8. 幻觉：成因与缓解 🔴🟡

### Q1: 幻觉的几种类型和成因？

```
类型 1: 事实性幻觉 (Factuality)
  "李白是宋朝人" → 错误的  原因: 训练数据有噪声 / 低频知识遗忘

类型 2: 忠诚性幻觉 (Faithfulness)  
  上下文说用 Python，回复写成 JS → 原因: 注意力分散 / 长上下文衰减

类型 3: 逻辑性幻觉
  "1+1=3" → 原因: 推理链断裂

类型 4: 无知型幻觉
  不知道但假装知道 → 原因: 训练目标 (预测下一个 token) ≠ 诚实表达无知

成因:
  - 训练数据: 网络文本本身有错
  - 解码策略: temperature 过高 → 随机性放大
  - 上下文过长: 论文发现标称 200K 的模型在 50K 处就开始性能下降
  - 知识边界模糊: 模型不知道自己不知道
```

### Q2: 怎么减少幻觉？

```
工程层 (Harness, 最可靠):
  1. RAG 检索外部知识 → 回答基于检索内容而非模型内部知识
  2. Tool Use → 查天气/查数据库/算数交给工具
  3. 引用标注 → 强制标注来源 → 没有来源就承认
  4. 后验证 → LLM-as-Judge 检查回答是否与上下文一致

Prompt 层:
  1. "如果不确定，说不知道" → 降低"不懂装懂"
  2. "逐步推理" → CoT 减少逻辑错误
  3. Few-shot 示范诚实行为

模型层:
  1. RLHF → 奖励诚实回答
  2. DPO 偏好对 → chosen="我不知道", rejected=编造的答案

NaNaGi 的做法:
  项目相关问题必须先调 get-project-info (幻觉防御)
  → 不经工具的回答直接标记为可疑
```

---

## 9. 长上下文技术 🟢🟡

### Q: 上下文窗口从 4K 膨胀到 1M+，技术怎么做到的？

```
关键技术:

1. RoPE (Rotary Position Embedding)
   - 通过旋转矩阵编码位置 → 天然支持外推
   - 训练 4K → 推理 32K+ (插值/扩展)
   - LLaMA/Qwen/DeepSeek 全在用

2. ALiBi (Attention with Linear Biases)
   - 不加位置编码，直接在 attention score 上加线性偏置
   - 越近的词偏置越大 → 天然外推
   - 简单但不如 RoPE 效果好

3. Ring Attention
   - 把长序列切成多块，GPU 之间环形传递 K,V
   - 多 GPU 协同处理超长序列

4. 稀疏注意力
   - Sliding Window: 每个 token 只看附近的（Mistral）
   - 全局+局部混合: Longformer

5. 上下文压缩
   - Prompt Compression: LLMLingua, 用小型 LM 压缩长文本
   - 论文关键发现: 标称 200K 的模型在 50K 处就开始性能下降
   → 压缩比堆窗口更关键
```

---

## 10. Prompt Engineering 进阶 🟡

### Q: 2026 年 Prompt Engineering 已经不够了，为什么？

```
标准技巧 (Happy-LLM 层级):
  - Few-shot / Zero-shot
  - CoT / Step-by-step
  - Role prompting
  - Output format constraint

为什么不够:
  Prompt 只管单次调用的"输入文本"——
  不管模型记不记得上次的对话 (Context)
  不管工具调用是否正确 (Harness-T)
  不管权限是否越界 (Harness-G)
  不管对话是否在偏离目标 (Harness-L)

从 Prompt → Context → Harness 的三阶段升级:
  Prompt: "怎么说话？" → ENGINEERING_FRAMEWORK 重新定义为 Persona Engineering
  Context: "看到什么？" → Relationship Engineering
  Harness: "怎么可靠干活？" → Social Harness Engineering

面试加分句型:
  "2026 年已经不是 Prompt Engineering 的时代了——不改模型只改 Harness，
   编码基准 10 倍提升。我的 NaNaGi 项目完整践行了 ETCLOVG 七层框架。"
```

---

## 11. 面试叙事：如何用 NaNaGi 反向碾压 🎯

### 面试常见 LLM 问题 → NaNaGi 降维打击

```
问: "你了解 Transformer 的 Attention 机制吗？"
答: (正常回答 Q/K/V + Multi-Head) 
   "在 NaNaGi 的记忆系统里，我实践了 attention 的工程应用——
    三维加权层次化检索，recency/keyword/semantic/relation 四个维度的
    attention fusion，用于从海量对话记忆中提取最相关的片段注入 context。"
   
问: "RAG 你做过吗？"
答: (正常回答分块+检索+生成)
   "NaNaGi 的记忆系统可以理解为一种关系型 RAG——但不是从文档库检索，
    而是从 IWM (Internal Working Model) + 显性记忆 + 环境感知三个数据源
    动态组装。而且有权限隔离——guest 搜不到主人的记忆。这是在标准 RAG
    之上的三层增强：关系感知 + Token 预算管理 + 腐化漂移防御。"
   
问: "你对 Agent 的理解是什么？"
答: (正常回答 ReAct + Tool Calling)
   "我遵循 2026 年 CMU/Yale/Amazon 的 Agent Harness Engineering 框架——
    ETCLOVG 七层架构，把 Agent 从'调 API'升级为系统工程。
    关键发现是：不改模型只改 Harness，编码基准 10 倍提升。
    我在 NaNaGi 上做了完整审计，总分 4.4/10，O 和 V 是最大短板正在补。
    而且我发现标准框架只为'做事型 Agent'设计——
    我把三层重新定义为 Persona/Relationship/Social Harness Engineering。"
   
问: "怎么评估 LLM 回复质量？"
答: (正常回答 MMLU/Chatbot Arena)
   "论文 V 层的核心发现：相同通过率背后可能是完全不同的系统质量。
    一个靠暴力重试，一个钻了测试漏洞——看最终得分不够，要看轨迹。
    我在 NaNaGi 做了双层验证：规则引擎的确定性边界检查 +
    LLM-as-Judge 异步社交质量打分。规则引擎不经 LLM——面试官通道
    永远不会露出'克劳德'这个词。"
   
问: "RLHF 和 DPO 的区别？"
答: (正常回答三阶段 vs 直接优化)
   "NaNaGi 不需要 RLHF——她的对齐目标不是迎合人类偏好，
    而是保持人格一致性。这更接近论文 Governance 层的'声明式章程'——
    人格定义作为顶层约束，比 reward model 更可靠。"
```

### 核心策略

```
Happy-LLM 教的知识 = 基础层（人人都会）
NaNaGi 实践 = 区分层（只有你做过的）
ETCLOVG 框架 = 碾压层（面试官可能还没读过的论文）

面试时：
  - 基础层快速带过（1 分钟）
  - 用 NaNaGi 的具体实践证明你真的做过（3 分钟）
  - 用 ETCLOVG 框架展示工程思维高度（2 分钟）
```

---

> **关联文件**：
> - `项目设计文档/Harness工程化架构设计.md` — ETCLOVG 完整诊断 + 面试话术
> - `项目设计文档/系统架构路线图v52.md` — 系统架构蓝图的实施计划
> - Happy-LLM 学习笔记 — Transformer 基础（本文档是它的升维补充）
>
> **使用建议**：面试前一晚过一遍，每道题准备 1-2 分钟口头回答 + NaNaGi 关联。
