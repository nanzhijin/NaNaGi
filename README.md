> 📖 [阅读中文版](./README_CN.md)

<div align="center">

# NaNaGi（ななぎ）

**Nan Zhijin's personal AI portfolio site. A dual-persona relational Agent — not a tool that does things for you, but an AI with emotions, a soul, and the ability to recognize and remember people.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-V4_Pro-4B6BFB.svg)](https://deepseek.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-Private-red.svg)]()

### 📁 Project Design Documents

<details>
<summary><b>🏗 Prompt + Context + Harness Engineering Architecture (V1)</b></summary>

- 📐 [Harness Engineering Architecture Design](./项目设计文档/Prompt%2Bcontext%2Bharness工程架构设计迭代V1/Harness工程化架构设计.md) — ETCLOVG 7-layer diagnostics + relational Agent specialization
- 🗺 [System Architecture Roadmap v5.2](./项目设计文档/Prompt%2Bcontext%2Bharness工程架构设计迭代V1/系统架构路线图v52.md) — Complete system blueprint (long-term vision)

</details>

<details>
<summary><b>🧠 Memory System Design (V2 → V3)</b></summary>

**V2 — Format Unification + Retrieval Architecture + Supervision**
- 🔍 [Memory Path Audit Report](./项目设计文档/记忆系统设计V2方案/记忆路径审计报告.md) — Read-write split diagnosis (fixed)
- 📝 [Memory Retrieval Design Argument](./项目设计文档/记忆系统设计V2方案/记忆检索设计论证.md) — frontmatter · MEMORY.md · [[link]] graph traversal
- 🛡 [Association Retrieval Supervision Argument](./项目设计文档/记忆系统设计V2方案/关联检索监督机制论证.md) — 3-layer Supervisor to prevent tunnel vision
- 📘 [Memory System Complete Design](./项目设计文档/记忆系统设计V2方案/记忆系统设计完整方案.md) — V2 final merged document

**V3 — Tiered Architecture + Dual-Persona Dual-Path + Read-Write Separation**
- 🏛 [Memory System Tiered Architecture](./项目设计文档/记忆系统设计V3方案/记忆系统分级架构方案.md) — L1/L2/L3 3 tiers + RAG retrieval loop
- 🔀 [Dual-Persona Dual-Path Retrieval & Read-Write Separation](./项目设计文档/记忆系统设计V3方案/双人格双路检索与读写分离设计.md) — companion (SIM-RAG) / worker (IterResearch)
- 📋 [Implementation Plan v5.3](./项目设计文档/实施计划v53.md) — 44 tasks × 4,165 lines × 19 paper citations

</details>

- 📋 [Code Directory Structure](./项目设计文档/代码目录结构.md)
- 🎨 [Frontend Restructuring Directory](./项目设计文档/前端重构目录.md) — Dual-persona UI · Memory Panel · Dashboard · Worker Retrieval · 6 phases

</div>

---

## 🍴 Fork Configuration Guide

```bash
# 1. Requirements: Node.js ≥20
node -v

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your own DeepSeek API Key

# 4. Start
npm run dev
# → http://localhost:3000
```

### Create `.env.local`

Copy everything below, **fill in only the 3 empty Keys**, the rest are pre-configured:

```env
# ===== 🔴 Fill in the 3 below yourself, leave the rest =====
DEEPSEEK_API_KEY=                           # ← Required! platform.deepseek.com → API Keys
HUNYUAN_API_KEY=                            # ← Optional! hunyuan.tencent.com console
HUNYUAN_KEY_ID=                             # ← Optional! same as above
WEATHER_API_KEY=                            # ← Optional! dev.qweather.com console
WEATHER_API_HOST=                           # ← Optional! same as above

# ===== ⬜ Below pre-configured, no changes needed =====
NANAGI_PASSWORD_HASH=$2b$10$M6BB.S2nbK17ouomz2DfDuy9Gl1ltSO8khE8ODECvgu53HrMwo3eS
NANAGI_ADMIN_PASSWORD_HASH=$2b$10$lxe2i8HMndSupJMG9qTCDOiSYr.8U4RiHn7EzZK2VxMDUW3eWVHXq
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=1661186826@qq.com
SMTP_PASS=vuwxobbjtdsieajd
SMTP_FROM=1661186826@qq.com
```

DeepSeek gives free credits on signup — enough to get started. Hunyuan and Weather are optional; chat works fine without them.

### Docker Quick Start

```bash
docker build -t nanagi .
docker run -p 3000:3000 --env-file .env.local nanagi
```

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Core Architecture](#2-core-architecture)
3. [🧠 Psychology Models × Architecture Mapping](#3-psychology-models--architecture-mapping)
4. [Implemented Capabilities](#4-implemented-capabilities)
5. [Implementation Plan v5.3](#5-implementation-plan-v53)
6. [Project Structure](#6-project-structure)
7. [📚 Complete Paper References](#7-complete-paper-references)
8. [Tech Stack](#8-tech-stack)
9. [Local Development](#9-local-development)
10. [ByteDance JD Gap Audit](#10-bytedance-jd-gap-audit)

---

## 1. Design Philosophy

### Traditional Agent vs NaNaGi

```
Tool-type Agent:   Helps you complete tasks. Success metric: Did it get done?
Relational Agent:  Maintains a relationship. Success metric: Does she remember me? 
                   Does she treat me differently from others?
```

99% of Agent projects on the market solve the same problem: **how to make LLMs better at completing tasks**. NaNaGi solves: **how to make LLMs have persistent relational memory and social context awareness**. Upgrading the Agent from "a tool that does things" to "a presence that knows people."

### Architectural Cornerstone: Agent = LLM + Harness Engineering

NaNaGi follows the **Agent Harness Engineering Survey** (ETCLOVG 7-layer framework) jointly published by CMU·Yale·JHU·Amazon in 2026. Without modifying model weights, only improving the Harness — 10× coding benchmark improvement, GPT-5.2-Codex from 52.8% → 66.5%. Frameworks on the market are designed for "task-oriented Agents" (Verification = Lint/Test, Governance = permission checks). NaNaGi fundamentally adapts these, redefining them as:

- **Persona Engineering** — Different social masks for different people
- **Relationship Engineering** — Not document retrieval, but "Who are you? What's our relationship?"
- **Social Harness Engineering** — Social consistency verification + emotion auditability + persona integrity protection

### Design Red Lines

- ❌ No LangChain/LangGraph — Custom-built Agent loop
- ❌ No SQLite — Filesystem-auditable
- ❌ No file operations / code execution / terminal commands — Bounded-Domain Agent

---

## 2. Core Architecture

### 2.1 Complete System Architecture (ETCLOVG 7 Layers)

```
                         ┌─────────────────────────────────────┐
                         │   L6: Entry Layer                    │
                         │                                     │
                         │  ┌──────┐  ┌──────┐  ┌──────┐      │
                         │  │Nan   │  │Inter-│  │Guest │      │
                         │  │Zhijin│  │viewer│  │      │      │
                         │  │admin │  │guest-│  │guest │      │
                         │  │      │  │  iv  │  │      │      │
                         │  └──┬───┘  └──┬───┘  └──┬───┘      │
                         │     │         │         │           │
                         │     └────┬────┴────┬────┘           │
                         │          │         │                │
                         │    ┌─────┴────┐ ┌──┴──────────┐    │
                         │    │JWT Auth  │ │PersonaSwitch │    │
                         │    │bcrypt+   │ │companion→    │    │
                         │    │  jose    │ │  worker      │    │
                         │    └─────┬────┘ └──────┬───────┘    │
                         └──────────┼──────────────┼───────────┘
                                    │              │
         ┌──────────────────────────┼──────────────┼───────────────┐
         │   L5: Personality Engine │              │                │
         │                          │              │                │
         │                    ┌──────┴──────┐       │                │
         │                    │Context Governor│◄────┘                │
         │                    │  Token budget  │                      │
         │                    │   ~8K, 7-seg   │                      │
         │                    │  dynamic       │                      │
         │                    └──────┬──────┘                        │
         │       ┌────────┬─────────┼─────────┬────────┐            │
         │       ▼        ▼         ▼         ▼        ▼            │
         │  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐    │
         │  │Self-   ││IWM Node││OCC     ││SIP     ││Inner   │    │
         │  │Node    ││6 trait ││Emotion ││Planning││Voice   │    │
         │  │6 trait ││K=adapt ││6-dim   ││6-step  ││condi-  │    │
         │  │K=0.05  ││        ││spring  ││5 pool  ││tional  │    │
         │  └────────┘└────────┘└────────┘└────────┘└────────┘    │
         └──────────────────────────┬───────────────────────────────┘
                                    │
         ┌──────────────────────────┼───────────────────────────────┐
         │   L4: Agent Execution    │                                │
         │   (ReAct Loop)          │                                │
         │                          ▼                                │
         │  ┌──────────────────────────────────────────────────┐    │
         │  │ while round < 5:                                  │    │
         │  │   STEP 0-2: Load IWM → Env perception → Signals   │    │
         │  │   STEP 3-7: OCC appraisal → Spring pullback →     │    │
         │  │            Graph propagation → Inner voice →      │    │
         │  │            SIP planning → Persona filter →        │    │
         │  │            Context assembly                       │    │
         │  │   STEP 8-9: LLM inference → tool_use/result → loop│    │
         │  │   STEP 10:  Post-process (Emotion/IWM/Mem/Cell)   │    │
         │  │   3-tier resilience: 30s timeout→1 retry→fallback │    │
         │  └──────────────────────────────────────────────────┘    │
         └──────────────────────────┬───────────────────────────────┘
                                    │
         ┌──────────────────────────┼───────────────────────────────┐
         │   L3: Tooling            │                                │
         │                    ┌──────┴──────┐                        │
         │                    │Tool Registry │                        │
         │                    │ Map<name,T> │                        │
         │                    └──────┬──────┘                        │
         │       ┌────────┬─────────┼─────────┬────────┐            │
         │       ▼        ▼         ▼         ▼        ▼            │
         │  get-time  get-weather  search-web  generate-image       │
         │  get-project-info  navigate-project  gnn-recommend       │
         │  search-memory  save-memory  🆕paper-search(worker)      │
         └──────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────────────────┐
         │   L2: Storage                                             │
         │                                                          │
         │  data/                                                    │
         │  ├── admin/          ← 👑 Nan Zhijin (filesystem, auditable)
         │  │   ├── nanzhijin-iwm.json                               │
         │  │   └── memories/   ← 🆕 .md + MEMORY.md index           │
         │  ├── leveldb/        ← 🌐 guest (file K-V)                │
         │  │   └── {personId}/                                      │
         │  │       ├── iwm.json / user.json                        │
         │  │       ├── memories/  ← 🆕 unified .md format           │
         │  │       └── cells/    ← conversation persistence         │
         │  └── memory/          ← V2.5 transitional (retired)       │
         └──────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────────────────┐
         │   L1: Quality (ETCLOVG → O+V+G)                           │
         │                                                          │
         │  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
         │  │ Observability   │ │ Verification    │ │ Governance  │ │
         │  │ LLMTrace        │ │ Social consist. │ │ Relationship│ │
         │  │ ToolTrace       │ │ Persona boundary │ │ Rate limit  │ │
         │  │ EmotionTrace    │ │ Hallucination   │ │ Token fuse  │ │
         │  │ IWM Delta       │ │ 🆕Supervisor×3   │ │ Audit trail │ │
         │  │ Cost/Session    │ │ (Drift/Critic/  │ │ Instruction │ │
         │  │ Metrics         │ │  Trajectory)    │ │ H1-H4 block │ │
         │  └─────────────────┘ └─────────────────┘ └────────────┘ │
         └──────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────────────────┐
         │   L0: External Dependencies                               │
         │   DeepSeek V4 Pro · Tencent Hunyuan · QWeather · QQ SMTP  │
         │   🆕 LanceDB · Sentence-BERT · arXiv API                  │
         └──────────────────────────────────────────────────────────┘
```

### 2.2 Social Graph + 3-Layer Psychology

NaNaGi's digital personality consists of four subsystems: one **Social Graph** provides stable relational representations, three **Psychological Layers** provide real-time behavioral decisions.

```
┌──────────────────────────────────────────────────────────┐
│              NaNaGi Social Graph                           │
│              Theory: Bowlby IWM + GraphSAGE                │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │ Self-Node │    │ IWM Node │    │ IWM Node │  ...      │
│  │ (her      │◄──►│ (you)    │◄──►│ (visitor) │           │
│  │  character)│   │ 6 traits  │    │ 6 traits  │           │
│  │ 6 traits  │    │ K=adaptive│   │ K=adaptive│           │
│  │ K=0.05    │    │           │    │           │           │
│  └──────────┘    └──────────┘    └──────────┘           │
│                                                          │
│  3-Layer Psychological Architecture:                      │
│  LAYER 1 — Anchoring Network (months~years): Self+IWM     │
│  LAYER 2 — Emotion Engine (minutes~hours): OCC+spring     │
│  LAYER 3 — Social Planning (seconds~minutes): SIP+Gross   │
└──────────────────────────────────────────────────────────┘
```

### 2.3 Dual Persona Mask (PersonaMask)

Same Self-Node, two modes of expression. Theoretical foundation: Jung's Persona.

| Dimension | companion (little daughter, default) | worker (elder daughter) |
|------|------------------------|-----------------|
| warmth | Self + 0.15 | Self - 0.25 |
| formality | Self - 0.40 | Self + 0.30 |
| playfulness | Self + 0.15 | Self - 0.35 |
| logicalRigor | Self - 0.60 | Self + 0.50 |
| emotionTracking | ✅ Explicit: lively, warm, playful | ✅ Reserved: composed, restrained, rational care |
| Retrieval Strategy | SIM-RAG (3 round cap) | IterResearch (autonomous stop) |
| Knowledge Base | Conversation memory | Conversation + paper search + textbook query |

### 2.4 User Access & Data Isolation

```
                    Browser (JWT Cookie)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │Nan     │ │Inter-  │ │Guest   │
         │Zhijin  │ │viewer  │ │        │
         │admin   │ │guest-iv│ │guest   │
         └───┬────┘ └───┬────┘ └───┬────┘
             │          │          │
    ┌────────┴──────────┴──────────┴────────┐
    │            middleware.ts               │
    │  JWT verify → role/personId/name/id   │
    │  → header: x-nanagi-role/person-id    │
    └───────────────────┬───────────────────┘
                        │
              ┌─────────┴─────────┐
              │   Persona Switch   │
              │  companion ←→ worker│
              └─────────┬─────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   ▼                   │
    │         buildSystemPrompt(ctx)        │
    │   ┌──────────────────────────────┐   │
    │   │ ChannelConfig (who)          │   │
    │   │  + PersonaMask (what state)   │   │
    │   │  + IWM Node (relationship)    │   │
    │   │  + MemoryContext (history)    │   │
    │   └──────────────────────────────┘   │
    └───────────────────┬───────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │  data/  │   │  data/  │   │  data/  │
    │ admin/  │   │leveldb/ │   │leveldb/ │
    │ (files) │   │guest-iv │   │ guest   │
    │auditable│   │interview│   │ isolated│
    └─────────┘   └─────────┘   └─────────┘
    
    Data Isolation: per-person independent subdirectory, physical isolation, no LLM pass-through
    Graph Propagation: only admin channel triggers Heider balance → mentioned person IWM update
    Memory Isolation: search_memory filters by personId, guests cannot see admin memories
```

### 2.5 Memory System 3-Tier Architecture (L1/L2/L3)

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory 3-Tier Architecture                 │
│         Theory: MEMTIER (2026) + EpochDB (2026)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ L1: Hot Memory — In System Prompt, ~4K tokens        │   │
│  │                                                     │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │ │IWM Summary│ │Rolling   │ │Session   │              │   │
│  │ │6 traits  │ │Summary   │ │Memory    │              │   │
│  │ │~500 tok  │ │2 lines   │ │~1000 tok │              │   │
│  │ │          │ │every 6   │ │this      │              │   │
│  │ │          │ │rounds    │ │session   │              │   │
│  │ │          │ │~1500 tok │ │          │              │   │
│  │ └──────────┘ └──────────┘ └──────────┘             │   │
│  │                                                     │   │
│  │ Trigger: every conversation | Latency: 0ms | No retrieval│
│  └─────────────────────────────────────────────────────┘   │
│                          │  L1 insufficient → trigger L2     │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ L2: Warm Memory — MEMORY.md index + Dual-Path        │   │
│  │                                                     │   │
│  │  Path 1 (deterministic): side-query LLM scans       │   │
│  │                          manifest → top-5            │   │
│  │  Path 2 (semantic):      Sentence-BERT embedding →   │   │
│  │                          cosine similarity           │   │
│  │  Fusion: RRF (Reciprocal Rank Fusion, semantic×1.5)  │   │
│  │  Basis: MemForge LongMemEval 93.2% R@5 hybrid        │   │
│  │                                                     │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐        │   │
│  │  │ .md files │   │MEMORY.md │   │[[link]]  │        │   │
│  │  │frontmatter│   │150-line  │   │graph     │        │   │
│  │  │4 fields  │   │cap, groups│   │Supervised│       │   │
│  │  │+ body    │   │          │   │3-layer   │        │   │
│  │  └──────────┘   └──────────┘   └──────────┘        │   │
│  │                                                     │   │
│  │  Trigger: every conversation | Latency: ~500ms | Cap: ~150│
│  └─────────────────────────────────────────────────────┘   │
│                          │  L2 < 3 results → trigger L3     │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ L3: Cold Memory — LanceDB Vector Index              │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────┐           │   │
│  │  │ LanceDB                                 │           │   │
│  │  │ · Full memory embeddings (Sentence-BERT) │           │   │
│  │  │ · Cosine top-k semantic search          │           │   │
│  │  │ · Memory decay: Ebbinghaus 14-day half-life│        │   │
│  │  │ · freshness < 0.2 → degrade to cold       │           │   │
│  │  │ · freshness < 0.05 → summary only          │           │   │
│  │  └──────────────────────────────────────┘           │   │
│  │                                                     │   │
│  │  Trigger: L2 recall insufficient | worker deep      │   │
│  │          search | keyword search                    │   │
│  │  Latency: <200ms | Capacity: unlimited              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🛡 Supervisor 3-Layer Oversight (on L2 [[link]]      │   │
│  │    traversal)                                        │   │
│  │                                                     │   │
│  │  Layer A: Semantic Drift  ─→ cosine < 0.3 → reject  │   │
│  │       ↓ pass                                         │   │
│  │  Layer B: Lightweight Critic → YES/NO binary         │   │
│  │       ↓ pass                                         │   │
│  │  Layer C: Relevance Trajectory → 3-step monotonic    │   │
│  │                                  decline → reject    │   │
│  │                                                     │   │
│  │  Hard stops: hop 4 | token>30% | dedup              │   │
│  │  Basis: GRAG tunnel vision (−0.086 nDCG@5)          │   │
│  │       + SIM-RAG Critic (SIGIR 2025)                 │   │
│  │       + Zanbaghi Semantic Drift (2025)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔀 Dual-Persona Retrieval Strategy Split             │   │
│  │                                                     │   │
│  │  companion (little daughter)    worker (elder)       │   │
│  │  ─────────────────────────      ────────────────     │   │
│  │  SIM-RAG loop                   IterResearch loop    │   │
│  │  Critic assesses sufficiency    Convergence judgment │   │
│  │  3-round cap                    Autonomous stop(max20)│   │
│  │  Light Reformulate              Deep Reformulate     │   │
│  │  Basis: SIM-RAG(SIGIR 2025)    Basis: IterResearch  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.6 Three-Tier Documentation System

| Document | Role | Audience |
|------|------|------|
| `README.md` (original Chinese) | Construction blueprint: implemented + near-term deliverables | Interview showcase |
| `项目设计文档/` (Design Docs) | Architecture design books + complete blueprint | Technical argumentation |
| `旧README.md` (Legacy README) | Historical archive | Design evolution evidence |

---

## 3. 🧠 Psychology Models × Architecture Mapping

> Each psychology model maps to a specific code module. This isn't "inspiration" — it's precise theory→engineering mapping.

### 3.1 Mapping Overview

```
External Input (user message · time · weather · IP)
   │
   ├──→ signals.ts ─────────────── ToM / Premack (P13)
   │     │                          🆕 P5-C: → Flavell metacognition + Wellman BDI
   │     │                          Infer others' mental states → multi-hypothesis + confidence
   │     ▼
   ├──→ ambient-context.ts ─────── PAD (P5) + Plutchik (P6)
   │     │                           Environment → emotion baseline, 6-dim offset
   │     ▼
   ├──→ emotion.ts ─────────────── OCC (P7) + LeDoux (P8) + McEwen (P9)
   │     │                          🆕 P5-C: OCC → CPM 5-dim (Scherer 1993-2009)
   │     │                          Low path: rule engine  |  High path: inner-voice.ts
   │     │                          Dual-spring pullback: Self K=0.05 / IWM K=adaptive
   │     ▼
   ├──→ graph.ts ───────────────── Bowlby (P1,P2) + Bretherton (P3)
   │     │                          IWM Node 6-dim representation (representation-not-reality)
   │     │                          Heider (P4): P-O-X balance → graph message propagation
   │     │                          Klein (P16): internal objects + Winnicott (P17): facilitating environment
   │     │                          GraphSAGE (T1): node embeddings
   │     ▼
   ├──→ planning.ts ────────────── Crick&Dodge SIP (P10) + Gross (P11)
   │     │                          6-step social information processing + 5 strategy pool + channel clamping
   │     ▼
   ├──→ persona.ts ─────────────── Jung (P4)
   │     │                          companion/worker dual mask
   │     ▼
   ├──→ filter.ts ──────────────── Young (P15)
   │     │                          Core anchoring: Self-Node K=0.05 extremely slow evolution
   │     │                          8-dim PersonaParameters output
   │     ▼
   └──→ context-governor.ts ────── Context Cartography (E6)
                                     Ternary space → 7-segment Token budget assembly
                                     SDT (P14): admin channel zero-obligation design
```

### 3.2 Precise Mapping Table

| # | Psychology Model | Paper/Year | NaNaGi Module | Status | Design Basis |
|---|-----------|----------|------------|------|---------|
| 1 | **Bowlby** Attachment Theory | 1969, 1973 | `personality/graph.ts` — IWM Node structure | ✅ Current | IWM Node 6 dimensions directly map Bowlby's Internal Working Model. Spring pullback dynamics from "repeated sensitive care" gradually building a secure base |
| 2 | **Bretherton & Munholland** IWM Elaboration | 2008 | `personality/graph.ts` — IWM as graph node | ✅ Current | IWM is a hierarchical, multi-dimensional representational structure — not a single "good/bad" rating but dynamic balance of 6 independent dimensions |
| 3 | **Heider** Balance Theory | 1958 | `personality/graph.ts` — Graph message passing | ✅ Current | P–O–X triadic balance. Admin mentions someone → Heider balance propagation → mentioned person's IWM Node updates. **Only admin channel triggers**, guests don't propagate |
| 4 | **Jung** Persona | 1943/1953 | `personality/persona.ts` — PersonaMask | ✅ Current | Same self presents different facets in different social contexts. companion (little daughter) vs worker (elder daughter) — same Self-Node, different expression biases |
| 5 | **Mehrabian & Russell** PAD Emotion Model | 1974 | `personality/ambient-context.ts` — Environmental baseline | ✅ Current | Physical environment (light, temperature, space) directly affects emotion 3 dimensions. AmbientContext produces ambientMood 6-dim offset as emotion baseline |
| 6 | **Plutchik** Emotion Wheel | 1980 | `personality/types.ts` — Emotion dimension selection | ✅ Current | Theoretical source for 3 extra dimensions (intimacy/pride/calmness), complementing PAD's pleasure/arousal/dominance into a 6-dim space |
| 7 | **OCC** Cognitive Appraisal of Emotions | 1988 | `personality/emotion.ts` — OCC Engine | ✅ Current | Emotions arise from 3-dim cognitive appraisal of events: goal relevance × expectation consistency × causal attribution → EmotionDelta. **Rule engine, no LLM** |
| 7+ | 🆕 **CPM** Component Process Model | 1993–2009 | `personality/emotion.ts` — upgrade | 📋 P5-C | Evolution of the same appraisal theory tradition. Appraisal dimensions 3→5 (adds novelty, coping), plus appraisalSequence multi-round appraisal. OCC retained as simplified path |
| 8 | **LeDoux** Dual-Pathway Emotion | 1996 | `personality/emotion.ts` + `inner-voice.ts` | ✅ Current | Low path (amygdala, <20ms) = rule engine; High path (cortex, 300-500ms) = inner voice LLM call. \|Δemotion\| > 0.15 → triggers high path |
| 9 | **McEwen & Stellar** Allostatic Load | 1993 | `personality/emotion.ts` — Dual-spring pullback | ✅ Current | Biological systems adapt set points under chronic stress. Self K=0.05 (extremely slow evolution, character hardware); IWM K=adaptive (relational flexibility) |
| 10 | **Crick & Dodge** SIP 6-Step | 1994 | `personality/planning.ts` — Social Planning | ✅ Current | Encode→Interpret→Clarify goals→Generate strategies→Evaluate→Execute. Guest 4 preset goals, admin 0 obligation (emergent) |
| 11 | **Gross** Emotion Regulation Strategies | 1998 | `personality/planning.ts` — Strategy Pool | ✅ Current | 5 strategies: situation selection/modification/attention deployment/cognitive reappraisal/response modulation. SIP Step 4 generation pool + channel differences (guest emotion clamping) |
| 12 | **ToM** (Premack & Woodruff) Theory of Mind | 1978 | `personality/signals.ts` — Signal Extraction | ✅ Current | Infer others' mental states. Cognitive basis for SIP Step 2 (interpret cues) + IWM understanding dimension. **Deterministic rule engine** |
| 12+ | 🆕 **Flavell Metacognition + Wellman Belief-Desire** | 1979–2014 | `personality/signals.ts` — upgrade | 📋 P5-C | From single-path inference → multi-hypothesis generation + confidence tracking. Flavell: "thinking about thinking". Wellman: BDI framework. Premack foundation retained |
| 13 | **SDT** Self-Determination Theory | 2000 | `personality/configs/` — Admin channel design | ✅ Current | Autonomy/Competence/Relatedness three basic psychological needs. Admin channel zero-obligation design → autonomy; IWM relational dimension → relatedness |
| 14 | **Young** Schema Therapy | 2003 | `personality/types.ts` — Self-Node definition | ✅ Current | Core personality structures formed early are stable and hard to change. Self-Node as "character hardware", K=0.05 extremely slow evolution |
| 15 | **Klein** Internal Objects | 1946, 1957 | `personality/graph.ts` — IWM representational nature | ✅ Current | IWM Node is representation-not-reality. Psychoanalytic foundation for care/respect dimensions |
| 16 | **Winnicott** Facilitating Environment | 1965 | `personality/graph.ts` — IWM dimension sources | ✅ Current | Healthy psychological development requires "good enough care". Source of IWM safety/intimacy dimensions |
| 17 | **GraphSAGE** Graph Neural Network | 2017 | `personality/graph.ts` — Message passing | ✅ Current | Inductive graph node embeddings. Mathematical correspondence between Social Graph Message Passing and node updates. Academic symmetry with Nan Zhijin's GNN social graph link prediction project |

> 📋 = Planned upgrade (P5-C phase implementation). Current architecture runs on the left-side models; after upgrade, OCC and Premack remain as simplified paths.

---

## 4. Implemented Capabilities

### P1-P4 ✅

| Phase | Core Deliverables |
|------|---------|
| P1 Agent Engine | ReAct 5-round loop + 8-tool registry + 3-tier resilience + dual-channel System Prompt + environment awareness (time/location/weather) |
| P2 Storage | store.ts unified interface (admin→filesystem, guest→LevelDB) + 6-table K-V + IWM persistence |
| P3 Auth | Email verification code registration + JWT (with personId/role/name/identity) + data isolation + role filtering |
| P4 Cell | Conversation list + slide-out panel + message persistence + rename/delete/pin + panel mutual exclusion |

### P3-P4 Fixes (6/16)

| Fix | Effect |
|--------|------|
| Memory path break | Admin read/write unified to `data/admin/memories/`, no longer dependent on `lib/memory.ts` |
| User memory isolation | personId physical isolation, guests cannot see admin memories |
| Read/write entry unification | All memory ops through `store.ts`, eliminates admin/guest dual-path branches |
| Format unification design | All users unified .md frontmatter + MEMORY.md index (P5-B implementation pending) |

---

## 5. Implementation Plan v5.3

> Full plan: [项目设计文档/实施计划v53.md](./项目设计文档/实施计划v53.md)

| Phase | Tasks | New Code | Core Deliverables | Status |
|------|--------|--------|---------|------|
| P1-P4 | Complete | — | Agent Engine + Storage + Auth + Cell | ✅ |
| P5-A Identity System | 4 | ~495 lines | types.ts + persona.ts + graph.ts | 🔴 Immediate |
| P5-B Cognitive Enhancement | 11 | ~1,230 lines | Context Governor + L1/L2/L3 Memory + LanceDB + OCC | 🔴 Immediate |
| P5-C Quality Assurance | 10 | ~750 lines | Observability + Supervisor 3-layer + Social Verification + Cost Guard | 🟡 |
| P5-D Closed Loop | 7 | ~740 lines | companion(SIM-RAG) / worker(IterResearch) + lifecycle + regression tests | 🟡 |
| P6 Interview Feedback | 3 | ~240 lines | Auto feedback extraction + admin dashboard | 🟡 |
| P7 Knowledge Base | 5 | ~560 lines | Worker toolset (paper/textbook/quality scoring) + gallery population + memory decay | 🟢 |
| P8 Launch | 4 | ~150 lines | Tencent Cloud + performance quantification + blog + dashboard frontend | 🟢 |
| **Total** | **44** | **~4,165 lines** | **12 new files** | |

### Key Paper Drivers

| Paper/Project | Driving Phase | Basis |
|-----------|---------|------|
| Claude Code Memory (2025) | P5-B | MEMORY.md production-validated, AutoCompact |
| MemForge (2026) | P5-B | LongMemEval 93.2% R@5, RRF fusion |
| EpochDB (2026) | P5-B | Tiered HNSW, perfect scores on all 4 benchmarks |
| Letta (2025) | P5-B/D | LoCoMo 74%, tool capability > data structure |
| SIM-RAG (2025) | P5-C/D | Critic pattern, 3 rounds optimal (companion) |
| IterResearch (2026) | P5-D | Markov workspace, autonomous stop (worker) |
| GRAG (2026) | P5-C | Tunnel vision −0.086 nDCG@5 → Supervisor |
| ETCLOVG (2026) | P5-C | O/V/G layer industry gaps → Observability/Verification |

---

## 6. Project Structure

```
NaNaGi/
├── src/
│   ├── agent/                       ← Agent Engine
│   │   ├── loop.ts                  ← ReAct loop (P1) + 🆕 companion/worker dual-path (P5-D)
│   │   ├── registry.ts              ← Tool registry (P1) + 🆕 adaptive discovery (P5-B)
│   │   ├── prompts.ts               ← System Prompt engine (P1) + 🆕 Context Governor (P5-B)
│   │   ├── types.ts                 ← Agent core types (P1)
│   │   ├── lifecycle.ts             ← 🆕 Session lifecycle closure (P5-D)
│   │   └── tools/                   ← 8 tools (P1) + 🆕 worker toolset (P7)
│   │
│   ├── personality/                 ← 🆕 Digital Personality Engine (P5)
│   │   ├── types.ts                 ← SelfNode/IWM/Emotion/PersonaMask (P5-A)
│   │   ├── persona.ts               ← companion/worker dual mask (P5-A)
│   │   ├── graph.ts                 ← Social graph engine (P5-A)
│   │   ├── context-governor.ts      ← Context Governor central dispatch (P5-B)
│   │   ├── emotion.ts               ← OCC emotion engine (P5-B)
│   │   ├── ambient-context.ts       ← Environment awareness (P5-B)
│   │   ├── signals.ts               ← External signal extraction (P5-B)
│   │   ├── memory-inner.ts          ← Invisible memory (P5-B)
│   │   ├── filter.ts                ← Persona filter layer (P5-C)
│   │   ├── planning.ts              ← SIP social planning (P5-C)
│   │   ├── verification.ts          ← Social consistency verification (P5-C)
│   │   ├── inner-voice.ts           ← Inner voice (P5-D)
│   │   └── configs/                 ← admin/guest channel params (P1)
│   │
│   ├── lib/
│   │   ├── store.ts                 ← Unified data access (P2) + 🆕 unified memory format (P5-B)
│   │   ├── memory.ts                ← Legacy memory system (V2.5, retired)
│   │   ├── memory-retrieval.ts      ← 🆕 Dual-path retrieval + Supervisor (P5-B/C)
│   │   ├── lancedb.ts               ← 🆕 L3 vector index (P5-B)
│   │   ├── embedding.ts             ← 🆕 Sentence-BERT (P5-B)
│   │   ├── observability.ts         ← 🆕 Structured Trace (P5-C)
│   │   ├── cost-guard.ts            ← 🆕 Rate limiting + Token fuse (P5-C)
│   │   ├── audit-log.ts             ← 🆕 Audit trail (P5-C)
│   │   ├── auth.ts / env.ts         ← Auth + security config (P1/P3)
│   │   ├── leveldb.ts               ← File K-V storage (P2)
│   │   ├── ambient.ts / email.ts    ← Environment + email (P1/P3)
│   │   └── cell-store.ts            ← Cell persistence (P4)
│   │
│   ├── app/
│   │   ├── api/chat/route.ts        ← Chat API (P1)
│   │   ├── api/auth/                ← Login/Register (P3)
│   │   ├── api/memory/              ← Memory REST API (P3, fixed)
│   │   └── api/admin/dashboard/     ← 🆕 Admin Dashboard (P7)
│   │
│   ├── components/                  ← UI (P1-P4)
│   └── contexts/                    ← React Context (P1-P4)
│
├── data/                            ← Runtime data (gitignored)
│   ├── admin/                       ← Nan Zhijin exclusive (filesystem)
│   │   ├── nanzhijin-iwm.json
│   │   └── memories/                ← 🆕 admin memories (.md)
│   ├── leveldb/{personId}/          ← guest data (file K-V)
│   │   ├── iwm.json / user.json
│   │   └── memories/                ← 🆕 unified .md format (P5-B)
│   └── memory/                      ← V2.5 transitional (retired)
│
├── tests/regression/                ← 🆕 Regression test suite (P5-D)
├── 项目设计文档/                     ← 9 design documents
└── 旧README.md                      ← Historical archive
```

---

## 7. 📚 Complete Paper References

### Psychology Models (17 papers — precisely mapped to code modules, see §3)

| # | Paper | Year | Driving Module |
|---|------|------|---------|
| P1 | Bowlby, *Attachment and Loss, Vol. 1* | 1969 | graph.ts — IWM foundation |
| P2 | Bowlby, *Attachment and Loss, Vol. 2* | 1973 | graph.ts — Secure base + spring dynamics |
| P3 | Bretherton & Munholland, *IWM Elaboration* | 2008 | graph.ts — Graph node theory |
| P4 | Heider, *Psychology of Interpersonal Relations* | 1958 | graph.ts — P–O–X balance, graph propagation |
| P5 | Jung, *Persona as a Segment of the Collective Psyche* | 1943/1953 | persona.ts — Dual mask theory foundation |
| P6 | Mehrabian & Russell, *Environmental Psychology* | 1974 | ambient-context.ts — PAD environmental input |
| P7 | Plutchik, *Emotion: A Psychoevolutionary Synthesis* | 1980 | types.ts — Emotion dimension selection |
| P8 | Ortony, Clore & Collins, *Cognitive Structure of Emotions* | 1988 | emotion.ts — OCC 3-dim appraisal |
| P9 | LeDoux, *The Emotional Brain* | 1996 | emotion.ts + inner-voice.ts — Dual pathway |
| P10 | McEwen & Stellar, *Stress and the Individual* | 1993 | emotion.ts — Allostatic Load / spring mechanics |
| P11 | Crick & Dodge, *SIP Reformulation* | 1994 | planning.ts — 6-step social information processing |
| P12 | Gross, *Emotion Regulation* | 1998 | planning.ts — 5 strategy pool + channel clamping |
| P13 | Premack & Woodruff, *Theory of Mind* | 1978 | signals.ts — ToM signal extraction |
| P14 | Deci & Ryan, *Self-Determination Theory* | 2000 | configs/ — Admin zero-obligation design |
| P15 | Young, Klosko & Weishaar, *Schema Therapy* | 2003 | types.ts — Self-Node core anchoring |
| P16 | Klein, *Notes on Schizoid Mechanisms* / *Envy and Gratitude* | 1946/1957 | graph.ts — IWM representational nature |
| P17 | Winnicott, *Maturational Processes* | 1965 | graph.ts — safety/intimacy dimension sources |

### Engineering & AI (19 papers — driving P5-B/C/D memory system & retrieval architecture)

| # | Paper/Project | Year/Venue | Driving Module | Key Basis |
|---|-----------|----------|---------|---------|
| E1 | Anthropic, *Claude Code Memory & Compaction* | 2025-2026 | context-governor.ts, store.ts | MEMORY.md production-validated, AutoCompact 9-segment |
| E2 | MemForge, *Hybrid Search + Sleep Cycles* | 2025-2026 | memory-retrieval.ts | LongMemEval 93.2% R@5, RRF fusion |
| E3 | EpochDB, *Tiered HNSW Memory Engine* | 2026 | lancedb.ts | LoCoMo/ConvoMem/LongMemEval/NIAH perfect scores |
| E4 | Letta (MemGPT), *OS-Style Agent Memory* | 2025-2026 | store.ts, tools/ | LoCoMo 74%, tool capability > data structure |
| E5 | Mem0, *Hybrid Vector-Graph Memory* | 2025-2026 | lancedb.ts | LoCoMo 68.4%, Ebbinghaus −59% token |
| E6 | *Context Cartography* | 2026 | context-governor.ts | Black Fog / Gray Fog / Visible Field ternary space |
| E7 | MEMTIER, *Tiered Memory Architecture* | 2026 | memory-retrieval.ts | 3-tier memory + PPO retrieval weights +33pp |
| E8 | SIM-RAG, SIGIR | 2025 | loop.ts (companion) | Reasoner-Critic architecture, 3 rounds optimal |
| E9 | IterResearch, ICLR | 2026 | loop.ts (worker) | Markov workspace, 2,048 rounds autonomous stop |
| E10 | GRAG, *Goal-Relative Adaptive Graph Retrieval* | 2026 | verification.ts | Tunnel vision −0.086 nDCG@5 |
| E11 | Zanbaghi et al., *Semantic Drift Analysis* | 2025 | memory-retrieval.ts | Cosine z-score, 92.5% accuracy, 0% false positive |
| E12 | Wei et al., *Shadows in the Attention* | 2025 | memory-retrieval.ts | Representation drift trajectory, JS-Drift threshold |
| E13 | Jeong, *Lightweight Relevance Grader*, ICICT | 2025 | memory-retrieval.ts | 1B model precision 0.775 ≈ 70B |
| E14 | Park et al., *Stop-RAG*, NeurIPS | 2025 | loop.ts | Q(λ) MDP stopping strategy |
| E15 | *TASR*, arXiv:2606.13814 | 2026 | memory-retrieval.ts | Training-free adaptive stopping |
| E16 | Wang et al., *SAGE*, arXiv:2605.12061 | 2026 | memory-retrieval.ts | Graph memory self-evolution |
| E17 | Liao, *EcphoryRAG* | 2025 | memory-retrieval.ts | Human cue-based recall, 94% token reduction |
| E18 | Luu et al., *HiGraAgent*, EACL | 2026 | memory-retrieval.ts | Dual Agent protocol, +11.7% accuracy |
| E19 | *Agent Harness Engineering: A Survey* (ETCLOVG) | 2026 | Global architecture | 7-layer framework, Agent = LLM + Harness |

### Technical Mapping

| # | Framework | Version |
|---|------|------|
| T1 | GraphSAGE (Hamilton, Ying & Leskovec, NeurIPS) | 2017 |

> GraphSAGE appears in both psychology and engineering references — it's the mathematical foundation for the Social Graph message passing mechanism, and also the core technology of Nan Zhijin's GNN project. Two birds, one stone.

---

## 8. Tech Stack

| Layer | Technology |
|----|------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5.7 |
| AI Engine | DeepSeek V4 Pro (Anthropic-compatible endpoint) |
| Image Gen | Tencent Hunyuan hy-image-v3.0 |
| Styling | Tailwind CSS 4 |
| Storage | Filesystem (admin) + File K-V (guest) + 🆕 LanceDB (L3 vector) |
| Embeddings | 🆕 Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2) |
| Auth | bcrypt + jose (JWT) + httpOnly Cookie |
| Email | QQ Mail SMTP |
| Weather | QWeather API (24h cache) |
| Geolocation | geoip-lite (MaxMind GeoLite2) |
| Deployment | Docker + 🆕 Tencent Cloud |

---

## 9. Local Development

```bash
npm install
cp .env.example .env.local  # Fill in DEEPSEEK_API_KEY etc.
npm run dev                  # http://localhost:3000
```

---

## 10. ByteDance JD Gap Audit

> Reference: ByteDance Agent Application Development Engineer (A156568) | Based on P1-P4 complete + P5 design-complete status

| Responsibility | Coverage | Key Evidence |
|------|--------|---------|
| ① Architecture/Skills | ████████ 80% | ReAct + 8-tool registry + Cell + ETCLOVG 7-layer audit |
| ② Task Planning | ████░░ 40% | SIP 6-step design complete (P5-C), IterResearch deep retrieval (P5-D) |
| ③ Performance/Resilience | ██████ 60% | 3-tier resilience + 24h cache + 🆕 cost guard/rate limit design |
| ④ Framework Distillation | ██████ 60% | agent/ standalone module + store.ts unified interface + 19 paper citations |
| ⑤ Frontier Tracking | ████████ 80% | ETCLOVG + SIM-RAG + IterResearch + MemForge + 19 engineering papers |
| ⑥ Production Launch | ████░░ 40% | Docker-ready + 🆕 P8 Tencent Cloud + performance quantification |

**Current biggest gap → resolved through design**: Task planning layer (P5-C SIP), memory retrieval at scale (L1/L2/L3 tiering), observability (P5-C Observability). Estimated coverage reaches 65-70% after code implementation.

---

> 📋 **Original Chinese README**: [README.md](./README.md) — full Chinese version
> 📋 **Legacy README**: [旧README.md](./旧README.md) — includes v5.1 detailed task list, 18 bug records, Block×P historical archive

---

## 📝 Memorandum

> Items noted for future consideration, not yet in the formal implementation plan

### Hermes Model — Open-Source Function Calling Candidate

**Source**: [NousResearch / Hermes](https://huggingface.co/NousResearch), open-source model series based on Llama fine-tuned for Tool Use / Function Calling.

**To Evaluate**:
- Hermes Function Calling Dataset — can auto-synthesize tool schemas + call examples from API docs, useful for NaNaGi worker mask tool expansion (paper-search / textbook-query / quality-score, etc.)
- Parallel Tool Calls — Hermes supports concurrent execution of multiple tool_calls in a single round; NaNaGi `agentLoop` is currently serial. P5-D can evaluate introducing this
- Local Deployment — run via Ollama, reducing API dependency for worker mask

**Status**: 📋 To be evaluated during P7 worker toolset phase. Current DeepSeek V4 Pro Anthropic endpoint's tool_use capability already satisfies P1-P5 needs, not blocking the mainline.
