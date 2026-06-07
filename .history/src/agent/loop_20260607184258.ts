// ============================================================
// NaNaGi Agent ReAct 循环引擎 — P1-6
// agentLoop(controller, ctx, messages) → SSE stream
// 5 轮上限 + hash 循环检测 + 三层容灾 (30s超时→重试→降级)
// ============================================================

import type { AgentContext, AgentMessage, LLMResponse, LoopState, LoopStopReason, ToolCall } from "./types";
import { buildSystemPrompt } from "./prompts";
import { listToolDefinitions, executeTools } from "./registry";
import { getDeepseekKey } from "@/lib/env";

// ==================== 配置 ====================

const MAX_ROUNDS = 5;
const DEEPSEEK_URL = "https://api.deepseek.com/anthropic/v1/messages";

// ==================== SSE 发射辅助 ====================

function emit(controller: ReadableStreamDefaultController, event: Record<string, unknown>) {
  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
}

function emitText(controller: ReadableStreamDefaultController, content: string) {
  emit(controller, { type: "text", content });
}

function emitDone(controller: ReadableStreamDefaultController) {
  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
}

// ==================== 循环检测 ====================

function hashToolCalls(calls: ToolCall[]): string {
  return calls
    .map((c) => `${c.name}:${JSON.stringify(c.arguments)}`)
    .sort()
    .join("|");
}

// ==================== DeepSeek 流式调用 ====================

async function callLLM(
  messages: Record<string, unknown>[],
  tools: Record<string, unknown>[],
  signal: AbortSignal
): Promise<LLMResponse | null> {
  const DEEPSEEK_KEY = getDeepseekKey();

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getDeepseekKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "deepseek-v4-pro[1m]",
      max_tokens: 4096,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "no body");
    console.error("[Agent] DeepSeek API error:", res.status, errorText.slice(0, 500));
    throw new Error(`DeepSeek API ${res.status}`);
  }

  return parseStreamResponse(res);
}

async function parseStreamResponse(response: Response): Promise<LLMResponse> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let textContent = "";
  let toolUseBlock: { id: string; name: string; input: string } | null = null;
  const toolCalls: ToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice(6);
      try {
        const parsed = JSON.parse(jsonStr);

        switch (parsed.type) {
          case "content_block_start": {
            const block = parsed.content_block;
            if (block?.type === "tool_use") {
              toolUseBlock = { id: block.id, name: block.name, input: "" };
            }
            break;
          }

          case "content_block_delta": {
            const delta = parsed.delta;
            if (delta?.type === "text_delta" && delta.text) {
              textContent += delta.text;
            } else if (delta?.type === "input_json_delta" && delta.partial_json && toolUseBlock) {
              toolUseBlock.input += delta.partial_json;
            }
            break;
          }

          case "content_block_stop": {
            if (toolUseBlock) {
              const args = safeParseJSON(toolUseBlock.input);
              toolCalls.push({
                id: toolUseBlock.id,
                name: toolUseBlock.name,
                arguments: args,
              });
              toolUseBlock = null;
            }
            break;
          }
        }
      } catch {
        // skip unparseable SSE lines
      }
    }
  }

  if (toolCalls.length > 0) {
    return { type: "tool_use", toolCalls };
  }
  return { type: "text", content: textContent };
}

function safeParseJSON(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

// ==================== 三层容灾 ====================

async function callLLMWithResilience(
  controller: ReadableStreamDefaultController,
  messages: Record<string, unknown>[],
  tools: Record<string, unknown>[],
  fallbackMsg: string
): Promise<LLMResponse | null> {
  // L1: 正常调用, 30s 超时
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 30_000);
    const result = await callLLM(messages, tools, ac.signal);
    clearTimeout(timeout);
    return result;
  } catch (err) {
    console.error("[Agent] L1 call failed:", err instanceof Error ? err.message : String(err));
  }

  // L2: 重试 1 次
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 30_000);
    const result = await callLLM(messages, tools, ac.signal);
    clearTimeout(timeout);
    return result;
  } catch (err) {
    console.error("[Agent] L2 retry failed:", err instanceof Error ? err.message : String(err));
  }

  // L3: 降级回复
  console.error("[Agent] L3 fallback triggered");
  emitText(controller, fallbackMsg);
  return null;
}

// ==================== Agent Loop ====================

export async function agentLoop(
  controller: ReadableStreamDefaultController,
  ctx: AgentContext,
  messages: AgentMessage[]
): Promise<AgentMessage[]> {
  const state: LoopState = { round: 0, callHistory: [], stopReason: null };
  const tools = listToolDefinitions() as unknown as Record<string, unknown>[];

  // 注入 _emit 回调 (工具发 SSE 事件用)
  ctx._emit = (event: Record<string, unknown>) => {
    emit(controller, event);
  };

  // 组装 System Prompt (只做一次)
  const systemPrompt = buildSystemPrompt(ctx);

  while (state.round < MAX_ROUNDS) {
    state.round++;

    // 构建 API 消息列表
    const apiMessages: Record<string, unknown>[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => {
        const msg: Record<string, unknown> = { role: m.role, content: m.content };
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.name) msg.name = m.name;
        return msg;
      }),
    ];

    // LLM 调用 (三层容灾)
    const response = await callLLMWithResilience(
      controller,
      apiMessages,
      tools,
      ctx.config.strategyPreference.responseModulation === "frequent"
        ? "抱歉呢，主人的 AI 服务暂时有点小麻烦，请稍后再试～"
        : "主人...我的大脑好像卡住了，能等一下吗？可能是 API 又在抽风..."
    );

    if (!response) break; // 三层全挂

    // 文本回复 → 存入 messages + SSE 推送 → 结束
    if (response.type === "text") {
      emitText(controller, response.content);
      messages.push({
        role: "assistant",
        content: response.content,
      });
      state.stopReason = "natural_stop";
      break;
    }

    // 工具调用 → 循环检测 → 执行 → 继续
    if (response.type === "tool_use") {
      // 循环检测
      const hash = hashToolCalls(response.toolCalls);
      if (state.callHistory.includes(hash)) {
        state.stopReason = "repeated_call";
        emitText(
          controller,
          "（让我整理一下已有的信息...）"
        );
        break;
      }
      state.callHistory.push(hash);

      // 执行工具
      const results = await executeTools(response.toolCalls, ctx);

      // 注入消息历史
      // content 不能为 null — DeepSeek 要求 string
      messages.push({
        role: "assistant",
        content: "",
        tool_calls: response.toolCalls,
      });
      // DeepSeek Anthropic 端点: role:"user" + tool_result JSON
      for (const r of results) {
        messages.push({
          role: "user",
          content: JSON.stringify({
            type: "tool_result",
            tool_use_id: r.tool_call_id,
            content: r.content,
          }),
        });
      }
    }
  }

  if (state.stopReason === "max_rounds") {
    emitText(controller, "（让我整理一下思路...）");
  }

  emitDone(controller);
  controller.close();
  return messages;
}
