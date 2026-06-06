// ============================================================
// 腾讯混元生图 API 客户端 — hy-image-v3.0
// API 文档：https://tokenhub.tencentmaas.com
// ============================================================

import { getHunyuanKeys } from "@/lib/env";

const HUNYUAN_BASE = "https://tokenhub.tencentmaas.com/v1/api/image";

interface SubmitResponse {
  id: string;
  model?: string;
  created?: number;
}

interface QueryResponse {
  id?: string;
  status: "in_progress" | "completed" | "failed";
  data?: Array<{ url: string; revised_prompt?: string }>;
  error?: string;
}

async function submitImage(prompt: string): Promise<string> {
  const res = await fetch(`${HUNYUAN_BASE}/submit`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getHunyuanKeys().apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hy-image-v3.0",
      prompt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`混元提交失败 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as SubmitResponse;
  if (!data.id) {
    throw new Error(`混元返回无任务ID: ${JSON.stringify(data)}`);
  }

  return data.id;
}

async function queryImage(taskId: string): Promise<QueryResponse> {
  const res = await fetch(`${HUNYUAN_BASE}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${getHunyuanKeys().apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hy-image-v3.0",
      id: taskId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`混元查询失败 (${res.status}): ${text}`);
  }

  return (await res.json()) as QueryResponse;
}

/**
 * 调用混元生图（异步 submit + 轮询 query）
 * @param prompt - 生图提示词
 * @param maxWaitMs - 最大等待时间（默认 60s）
 * @returns 图片 URL
 */
export async function generateImage(
  prompt: string,
  maxWaitMs = 60_000
): Promise<string> {
  const { apiKey } = getHunyuanKeys();
  if (!apiKey) {
    throw new Error("HUNYUAN_API_KEY 未配置");
  }

  // 1. 提交生图任务
  console.log("[Hunyuan] 提交生图:", prompt);
  const taskId = await submitImage(prompt);
  console.log("[Hunyuan] 任务ID:", taskId);

  // 2. 轮询查询结果（状态：in_progress → completed）
  const startTime = Date.now();
  const pollInterval = 2000; // 2s
  let attempt = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    await sleep(pollInterval);

    const result = await queryImage(taskId);
    console.log(`[Hunyuan] 轮询 #${attempt}: ${result.status}`);

    // ✅ 正常完成
    if (result.status === "completed" && result.data?.[0]?.url) {
      console.log("[Hunyuan] ✅ 生图完成:", result.data[0].url.slice(0, 100));
      return result.data[0].url;
    }

    // ❌ 完成但空 URL — 混元拒绝生图（额度/审核/限流），不给它轮询机会
    if (result.status === "completed") {
      const url = result.data?.[0]?.url || "";
      if (!url) {
        console.error("[Hunyuan] ❌ 完成但URL为空 — 可能是额度耗尽或内容审核拦截");
        throw new Error(
          "混元生图被拒：API返回空图片。请检查API额度是否耗尽，或尝试更换提示词。"
        );
      }
    }

    if (result.status === "failed") {
      throw new Error(`混元生图失败: ${result.error || "未知错误"}`);
    }

    // status === "in_progress" → 继续等
  }

  throw new Error(`混元生图超时 (${maxWaitMs / 1000}s)，任务ID: ${taskId}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
