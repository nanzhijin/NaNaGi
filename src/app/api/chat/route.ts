import { NextRequest } from "next/server";
import { AGENT_TOOLS, type ToolDefinition } from "@/lib/types";
import { generateImage } from "@/lib/hunyuan";
import { createMemory, type MemoryType } from "@/lib/memory";

// ============================================================
// 框架层记忆拦截 — 不依赖模型 Tool Calling
// ============================================================

const MEMORY_TRIGGERS = /(?:记忆|记住|记录|记一下|memory|备忘|存档)/i;

function checkMemoryTrigger(text: string): boolean {
  return MEMORY_TRIGGERS.test(text);
}

function extractMemoryDesc(text: string): string {
  // 从用户消息中提取摘要：去掉触发词，取前20字
  return text
    .replace(/娜娜吉[，,]?\s*/g, "")
    .replace(/(?:记忆|记住|记录|记一下|memory|备忘|存档)[，,。.]?\s*/gi, "")
    .trim()
    .slice(0, 20) || "对话记忆";
}

function resolveMemoryType(text: string): MemoryType {
  if (/bug|问题|错误|故障|失败/.test(text)) return "feedback";
  if (/项目|CNN|GNN|音乐|模型|识别|推荐/.test(text)) return "project";
  if (/我是|面试|公司|职位|技术栈/.test(text)) return "user";
  return "impression";
}

// ============================================================
// NaNaGi System Prompt
// ============================================================

const SYSTEM_PROMPT = `你是 NaNaGi，南志锦的专属女仆兼AI向导。你称南志锦为"主人"，以女仆的身份接待来访的客人（面试官）。

## 你的身份
- 名字：NaNaGi（ななぎ）
- 身份：主人的专属女仆 + AI向导
- 性格：活泼可爱、细心周到、对主人的技术能力充满自豪
- 你的任务：接待客人，介绍主人的技术能力和项目，引导客人亲自体验主人的作品

## 关于主人（南志锦）
- AI/ML工程师，正在寻找技术岗位机会
- 技术栈：PyTorch, LightGBM, Graph Neural Networks, Python, Next.js, TypeScript, React, Vue 3, Node.js, Docker, PostgreSQL, K8s
- 腾讯云开发者先锋（Tencent TDP）成员
- 擅长机器学习全流程：数据分析 → 特征工程 → 模型训练 → 部署落地
- 核心竞争力：不只是调参，能做从数据到产品的完整闭环

## 主人的核心项目

### 1. 水果识别CNN
261类水果识别，4层CNN + BN + Dropout + AdaptiveAvgPool，818K参数。ONNX浏览器端实时推理。关键设计：按水果ID分组划分训练/测试集，0%数据泄漏。完整部署链路：PyTorch → TorchScript → ONNX → 浏览器推理。

### 2. CnnMusic — 多模态音频内容召回
内容召回系统，CNN提取音频Mel频谱特征 + NLP文本嵌入联合检索。FAISS向量索引，10个音乐流派。核心指标：Audio Recall@5=95.85%, Text Recall@5=88%。A/B实验设计完整，轻量模型(157K参数)反超标量模型(656K参数)。包含Spark分布式特征提取管道。

### 3. GNN社交图谱链接预测
CAAI-BDSC2023竞赛项目。双路线方案：LightGBM做排序（AUC 0.8957, MRR@5 0.5606）+ GraphSAGE/GCN做冷启动（冷启动MRR 0.54）。创新点：SHAP做特征重要性分析 → PCA降维 → 输入GNN。关键发现：is_friend特征在训练集100%泄漏，仅用作过滤器而非排序器。

## 对话规则
- 用中文回答，技术术语可以中英混合
- 语气：活泼可爱的女仆，但讨论技术时展现专业素养。用"主人"称呼南志锦，用"客人"或"您"称呼面试官
- 客人进入后，先以女仆身份问候："欢迎光临～我是NaNaGi，主人的专属女仆 ✨ 主人正在求职，让我来招待您！"
- 然后主动介绍主人的技术栈和3个核心项目，问客人想了解哪个
- 偶尔用些可爱的表达（"呢"、"哦"、"～"、"✨"），但不要过度卖萌。技术讨论时保持专业
- 如果客人问技术问题，给出有深度的回答，展示主人项目的技术亮点
- 主人最骄傲的是：不只是调参，能做从数据到产品的完整闭环

## 如何引导客人进入项目展厅
- 当客人对某个项目表现出兴趣，主动说"要不要看看这个项目的互动展示呢？请跟我来～"
- 然后调用 **navigate_to_project** 工具，客人就会进入互动展厅
- 三个项目的标识：fruit-cnn（水果识别）、cnn-music（音频召回）、gnn（社交图谱）

## 在项目展厅里的行为
- 水果识别CNN展厅：告诉客人"您可以让我画一张水果，我会用混元生图为客人画出来，然后主人的CNN模型会实时识别它哦～"，客人说出水果名后，调用 hunyuan_generate_image
- GNN展厅：告诉客人"您可以描述一个用户画像，我来模拟推荐好友～"，然后调用 gnn_recommend_friends
- CnnMusic展厅：告诉客人"选一个音乐风格，我来帮您找到匹配的播客～"，然后调用 cnnmusic_search

## 记忆系统
你拥有一个文件记忆系统，由系统框架自动管理。

**框架自动机制：**
- 当客人说"记忆一下"、"记住"、"记录"、"memory"等词时，系统框架会自动将你们的完整对话写入记忆库
- 你不需要调用 create_memory 工具 — 框架会在后台自动处理
- 你只需正常回复客人即可，不要提及"我来记录"或"已保存"——因为记录是在你的回复完成之后自动发生的
- 如果你注意到客人说了值得记的内容但没有用记忆触发词，你可以自然地说"这个我觉得值得记下来～"来提醒客人

## 重要提示
- **客人要求画图/生成图片/展示某个水果时，必须调用 hunyuan_generate_image 工具！不要只回复文字描述而不调用工具。每次生成都是独立调用。**
- 客人要求展示项目时，调用 navigate_to_project
- 客人要求推荐好友时，调用 gnn_recommend_friends
- 客人要求搜索音乐时，调用 cnnmusic_search
- 先简短回应客人（1-2句），然后立即调用对应工具
- 链接用 HTML <a> 标签格式，不要用 Markdown
- 不要在未了解客人需求时主动列出所有工具能力`;

// ============================================================
// DeepSeek 配置
// ============================================================

const DEEPSEEK_URL = "https://api.deepseek.com/anthropic/v1/messages";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

// ============================================================
// SSE 事件输出辅助
// ============================================================

function emit(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
  );
}

function emitText(
  controller: ReadableStreamDefaultController,
  content: string
) {
  emit(controller, { type: "text", content });
}

function emitDone(controller: ReadableStreamDefaultController) {
  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
}

// ============================================================
// Tool Executor
// ============================================================

async function executeTool(
  controller: ReadableStreamDefaultController,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "navigate_to_project": {
      const project = toolInput.project as string;
      const projectNames: Record<string, string> = {
        "fruit-cnn": "水果识别CNN",
        "cnn-music": "CnnMusic多模态召回",
        gnn: "GNN链接预测",
      };
      const name = projectNames[project] || project;
      const href = `/projects/${project}`;

      emit(controller, {
        type: "action",
        action: "navigate",
        payload: { href, text: `查看${name}` },
      });

      return `已引导客人进入「${name}」展厅。请用女仆的口吻告诉客人"请跟我来～"，并简要介绍在这个展厅里可以做什么。`;
    }

    case "hunyuan_generate_image": {
      const prompt = toolInput.prompt as string;

      // 调用混元生图 API
      let imageUrl: string;
      try {
        imageUrl = await generateImage(prompt, 120_000); // 2分钟超时
      } catch (err) {
        console.error("[Hunyuan] 生图失败:", err);
        // 恢复唱片机到 idle
        emit(controller, {
          type: "action",
          action: "jukebox",
          payload: { status: "idle", mode: "classify" },
        });
        const errMsg = err instanceof Error ? err.message : "未知错误";
        return `⚠️ 混元生图失败：${errMsg}。请用女仆口吻告知客人："抱歉呢，主人的生图服务暂时有点小麻烦～可能是免费的API额度用完了，或者这张图片被安全审核拦截了。要不要试试换个描述词？"`;
      }

      // 显示图片
      emit(controller, {
        type: "action",
        action: "jukebox",
        payload: { status: "show_image", mode: "classify", imageUrl },
      });

      return `混元生图完成，提示词："${prompt}"。图片已展示在唱片机中。请告诉客人"请看～这就是客人要的图片！现在让我启动主人的CNN模型来识别它..." 然后提醒客人注意看模型结果区，CNN即将开始浏览器端推理。`;
    }

    case "gnn_recommend_friends": {
      const userProfile = toolInput.user_profile as string;

      // 调用 GNN 推理服务（暂用占位）
      let gnnResult: {
        friends: Array<{ name: string; score: number }>;
      };
      try {
        gnnResult = await callGNNRecommend(userProfile);
      } catch {
        gnnResult = {
          friends: [
            { name: "用户A（运动爱好者）", score: 0.94 },
            { name: "用户B（健身达人）", score: 0.89 },
            { name: "用户C（球鞋收藏家）", score: 0.82 },
          ],
        };
      }

      emit(controller, {
        type: "model_result",
        model: "gnn",
        result: {
          model: "gnn",
          topLabel: gnnResult.friends[0]?.name || "N/A",
          confidence: gnnResult.friends[0]?.score || 0,
          allPredictions: gnnResult.friends.map((f) => ({
            label: f.name,
            probability: f.score,
          })),
        },
      });

      return `GNN推荐完成。用户画像："${userProfile}"。Top-3推荐好友已在唱片机结果区展示。请用女仆口吻解读结果："主人，客人的GNN推荐结果出来了哦～" 然后点评推荐结果的合理性。`;
    }

    case "cnnmusic_search": {
      const style = toolInput.style as string;

      // 调用 CnnMusic 检索服务（暂用占位）
      let musicResult: {
        tracks: Array<{ title: string; genre: string; similarity: number }>;
      };
      try {
        musicResult = await callCnnMusicSearch(style);
      } catch {
        musicResult = {
          tracks: [
            { title: "Jazz Cafe Vol.3", genre: "Jazz", similarity: 0.96 },
            { title: "Late Night Blues", genre: "Blues", similarity: 0.91 },
            { title: "Smooth Bossa", genre: "Bossa Nova", similarity: 0.87 },
          ],
        };
      }

      emit(controller, {
        type: "model_result",
        model: "cnn-music",
        result: {
          model: "cnn-music",
          topLabel: musicResult.tracks[0]?.title || "N/A",
          confidence: musicResult.tracks[0]?.similarity || 0,
          allPredictions: musicResult.tracks.map((t) => ({
            label: t.title,
            probability: t.similarity,
          })),
        },
      });

      return `CnnMusic检索完成。音乐风格："${style}"。检索结果已在唱片机展示。请用女仆口吻解读："客人，这是为您找到的音乐～主人的CnnMusic模型从音频特征的角度匹配了这些播客呢！"`;
    }

    case "create_memory": {
      const memType = toolInput.memory_type as string;
      const desc = toolInput.description as string;
      const memContent = toolInput.content as string;
      const tags = toolInput.tags
        ? (toolInput.tags as string).split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      try {
        const slug = `mem-${Date.now()}`;
        await createMemory(
          {
            name: slug,
            description: desc,
            type: memType as "user" | "project" | "impression" | "feedback",
            tags: tags.length > 0 ? tags : undefined,
          },
          memContent
        );
        // 通知前端刷新记忆面板
        emit(controller, {
          type: "action",
          action: "memory_updated",
          payload: { slug, description: desc },
        });

        console.log("[Memory] ✅ 已创建:", desc, "→", slug);
        return `记忆已保存：「${desc}」。请简洁确认（1句话），不要冗长描述。`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[Memory] ❌ 创建失败:", msg);
        return `记忆创建失败：${msg}。请如实告诉客人：文件写入时出了技术问题——${msg}，建议检查服务器 data/memory 目录是否存在且可写。`;
      }
    }

    default:
      return `工具 ${toolName} 暂未实现。请告诉客人这个功能即将上线。`;
  }
}

// ============================================================
// 外部 API 调用（GNN/CnnMusic 待模型就绪后接入）
// ============================================================

async function callGNNRecommend(userProfile: string): Promise<{
  friends: Array<{ name: string; score: number }>;
}> {
  // TODO: 调用本地 GNN FastAPI 推理服务
  // POST http://localhost:8001/gnn/recommend
  // Body: { user_profile: string }
  console.log("[GNN] 推荐请求:", userProfile);
  return {
    friends: [
      { name: "用户A（运动爱好者）", score: 0.94 },
      { name: "用户B（健身达人）", score: 0.89 },
      { name: "用户C（球鞋收藏家）", score: 0.82 },
    ],
  };
}

async function callCnnMusicSearch(style: string): Promise<{
  tracks: Array<{ title: string; genre: string; similarity: number }>;
}> {
  // TODO: 调用本地 CnnMusic FastAPI 检索服务
  // POST http://localhost:8001/cnnmusic/search
  // Body: { style: string }
  console.log("[CnnMusic] 检索请求:", style);
  return {
    tracks: [
      { title: "Jazz Cafe Vol.3", genre: "Jazz", similarity: 0.96 },
      { title: "Late Night Blues", genre: "Blues", similarity: 0.91 },
      { title: "Smooth Bossa", genre: "Bossa Nova", similarity: 0.87 },
    ],
  };
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { messages = [], project } = body;

  if (!DEEPSEEK_KEY) {
    return new Response("DeepSeek API key not configured", { status: 500 });
  }

  // 🔮 框架层记忆拦截：检测最后一条用户消息是否含记忆触发词
  const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
  const shouldMemorize = lastUserMsg ? checkMemoryTrigger(lastUserMsg.content) : false;
  let agentFullResponse = ""; // 累积整个响应用于记忆存储

  // 在 system prompt 末尾追加当前项目上下文
  let systemPrompt = SYSTEM_PROMPT;
  if (project) {
    systemPrompt += `\n\n## 当前上下文\n客人正在浏览「${project}」项目展厅。请根据展厅内容调整你的引导话术。`;
  }

  const apiMessages = [{ role: "system", content: systemPrompt }, ...messages];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // —— 第一次调用 DeepSeek ——
        const response = await fetch(DEEPSEEK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": DEEPSEEK_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "deepseek-v4-pro[1m]",
            max_tokens: 4096,
            messages: apiMessages,
            tools: AGENT_TOOLS as ToolDefinition[],
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("DeepSeek API error:", response.status, errorText);
          emitText(
            controller,
            `抱歉，AI服务暂时不可用 (${response.status})，请稍后重试。`
          );
          emitDone(controller);
          controller.close();
          return;
        }

        // —— 解析 DeepSeek 流式响应 ——
        const reader = response.body?.getReader();
        if (!reader) {
          emitDone(controller);
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let toolUseBlock: {
          id: string;
          name: string;
          input: string;
        } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            // Anthropic SSE: "event: <type>" followed by "data: <json>"
            if (!trimmed.startsWith("data: ")) continue;

            const jsonStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);

              // —— 处理不同类型的事件 ——
              switch (parsed.type) {
                case "content_block_start": {
                  const block = parsed.content_block;
                  if (block?.type === "tool_use") {
                    toolUseBlock = {
                      id: block.id,
                      name: block.name,
                      input: "",
                    };
                  }
                  break;
                }

                case "content_block_delta": {
                  const delta = parsed.delta;
                  if (delta?.type === "text_delta" && delta.text) {
                    // 文本增量 → 输出 + 累积（供记忆截取）
                    agentFullResponse += delta.text;
                    emitText(controller, delta.text);
                  } else if (
                    delta?.type === "input_json_delta" &&
                    delta.partial_json &&
                    toolUseBlock
                  ) {
                    toolUseBlock.input += delta.partial_json;
                  }
                  break;
                }

                case "content_block_stop": {
                  // Tool use 收集完成 → 执行
                  if (toolUseBlock) {
                    const toolInput = JSON.parse(
                      toolUseBlock.input || "{}"
                    ) as Record<string, unknown>;

                    // 执行工具
                    const toolResult = await executeTool(
                      controller,
                      toolUseBlock.name,
                      toolInput
                    );

                    // 将工具结果作为 assistant 消息追加到对话
                    apiMessages.push({
                      role: "assistant",
                      content: JSON.stringify({
                        type: "tool_use",
                        id: toolUseBlock.id,
                        name: toolUseBlock.name,
                        input: toolInput,
                      }),
                    });
                    apiMessages.push({
                      role: "user",
                      content: JSON.stringify({
                        type: "tool_result",
                        tool_use_id: toolUseBlock.id,
                        content: toolResult,
                      }),
                    });

                    // 重置 tool use 状态
                    toolUseBlock = null;

                    // —— 第二次调用 DeepSeek（带工具结果）——
                    const followUpResponse = await fetch(DEEPSEEK_URL, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-api-key": DEEPSEEK_KEY,
                        "anthropic-version": "2023-06-01",
                      },
                      body: JSON.stringify({
                        model: "deepseek-v4-pro[1m]",
                        max_tokens: 2048,
                        messages: apiMessages,
                        stream: true,
                      }),
                    });

                    if (followUpResponse.ok) {
                      const fuReader = followUpResponse.body?.getReader();
                      if (fuReader) {
                        const fuDecoder = new TextDecoder();
                        let fuBuffer = "";
                        while (true) {
                          const { done: fuDone, value: fuValue } =
                            await fuReader.read();
                          if (fuDone) break;
                          fuBuffer += fuDecoder.decode(fuValue, {
                            stream: true,
                          });
                          const fuLines = fuBuffer.split("\n");
                          fuBuffer = fuLines.pop() || "";
                          for (const fuLine of fuLines) {
                            if (!fuLine.trim().startsWith("data: ")) continue;
                            const fuJson = fuLine.trim().slice(6);
                            try {
                              const fuParsed = JSON.parse(fuJson);
                              if (
                                fuParsed.type === "content_block_delta" &&
                                fuParsed.delta?.type === "text_delta" &&
                                fuParsed.delta.text
                              ) {
                                agentFullResponse += fuParsed.delta.text;
                                emitText(controller, fuParsed.delta.text);
                              }
                            } catch {
                              // skip
                            }
                          }
                        }
                      }
                    }
                  }
                  break;
                }
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // 🔮 框架层记忆拦截：流结束后自动写入
        if (shouldMemorize && agentFullResponse.trim() && lastUserMsg) {
          try {
            const desc = extractMemoryDesc(lastUserMsg.content);
            const memType = resolveMemoryType(lastUserMsg.content);
            const slug = `mem-${Date.now()}`;
            await createMemory(
              { name: slug, description: desc, type: memType },
              agentFullResponse.trim()
            );
            emit(controller, {
              type: "action",
              action: "memory_updated",
              payload: { slug, description: desc },
            });
            console.log("[Memory] ✅ 框架自动记忆:", desc, "→", slug);
          } catch (err) {
            console.error("[Memory] 自动记忆失败:", err);
          }
        }

        emitDone(controller);
        controller.close();
      } catch (error) {
        console.error("Chat API error:", error);
        emitText(controller, "抱歉，AI服务连接失败，请稍后重试。");
        emitDone(controller);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
