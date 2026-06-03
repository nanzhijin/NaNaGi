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
| **记忆系统** | Claude Code 风格文件记忆，框架层自动拦截触发词 |
| **记忆面板** | 左侧滑出，像素风卡片，悬浮放大，单击查看，管理员删除 |
| **聊天持久化** | sessionStorage 跨页面导航保持 + 刷新恢复 |
| **项目展厅** | 3 个项目页（FruitCNN / CnnMusic / GNN），SSG 预渲染 |
| **三风格设计系统** | 女仆围裙 + 像素下午茶 + 星尘备忘录 |

### 开发中 ⚠️

| 功能 | 说明 |
|------|------|
| **CNN ONNX 推理** | 浏览器端实时图像分类（模型已就绪，待集成） |
| **GNN 实时推荐** | Python FastAPI 推理服务（模型已就绪，待部署） |
| **CnnMusic 检索** | FAISS 相似度检索服务（模型已就绪，待部署） |
| **服务器部署** | 腾讯云 Lighthouse 2C4G 5M，域名 nanagi.cn，ICP 备案中 |

---

## 架构设计

```
┌────────────────────────────────────────────┐
│              NaNaGi Agent                    │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │   Claude Code 框架层（协调与调度）   │     │
│  │  Tool Calling / 子Agent / 多步推理  │     │
│  ├────────────────────────────────────┤     │
│  │   DeepSeek V4 Pro 引擎             │     │
│  │   Anthropic 兼容 API               │     │
│  ├────────────────────────────────────┤     │
│  │   工具层                           │     │
│  │   🎨 混元生图  🍎 CNN 🔗 GNN 🎵 Music │  │
│  ├────────────────────────────────────┤     │
│  │   框架层记忆拦截                   │     │
│  │   关键词检测 → 自动写文件 → 面板刷新 │     │
│  └────────────────────────────────────┘     │
└────────────────────────────────────────────┘
```

### 记忆系统 — Claude Code 风格

```
/data/memory/
├── MEMORY.md              ← 自动维护的索引
├── mem-*.md               ← 记忆文件（YAML frontmatter）
└── ...

触发机制：用户消息含"记忆/记住/记录/memory" → 框架自动拦截
         → DeepSeek 回复结束后将完整响应写入文件
         → SSE memory_updated → 前端面板自动刷新
```

### SSE 流协议

| event type | 作用 |
|------------|------|
| `text` | NaNaGi 说的话，进聊天气泡 |
| `action:jukebox` | 控制唱片机状态 |
| `action:navigate` | 跳转项目页 |
| `action:memory_updated` | 通知前端刷新记忆面板 |
| `model_result` | 模型原始推理结果 |

---

## 技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + TypeScript |
| 样式 | Tailwind CSS 4 + 像素风三风格设计系统 |
| AI 引擎 | DeepSeek V4 Pro（Anthropic 兼容端点） |
| Agent 框架 | Claude Code 框架模式（Tool Calling + 子Agent 调度） |
| 鉴权 | bcryptjs + jose (JWT) + 双角色 |
| 生图 | 腾讯混元 hy-image-v3.0 |
| 记忆存储 | 文件系统（YAML frontmatter + Markdown） |
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

---

## 路线图

- [x] **V1** — 网站框架 + 密码鉴权 + Agent 对话 + 项目页骨架
- [x] **V2** — 结构化 SSE + Tool Calling + 混元生图 + 唱片机 + 记忆系统 + 三风格设计
- [ ] **V2.5** — CNN ONNX 浏览器推理 + 缓存降级
- [ ] **V3** — Python FastAPI 推理服务 + 服务器部署上线

---

## TDP 投稿计划

本项目将投稿至**腾讯云开发者先锋（TDP）公众号**，作为南志锦的专业技术背书。

---

## License

Private — 仅供面试使用。源码不公开。
