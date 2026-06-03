"use client";

import { useEffect, useRef, useState } from "react";
import type { JukeboxState, JukeboxMode, ModelResultData } from "@/lib/types";
// import { useChat } from "@/contexts/ChatContext"; // V3: CNN ONNX 推理时使用

// ============================================================
// NaNaGi 唱片机 — 星尘备忘录风格
// 像素唱片机 + ✨轻魔法粒子 + 推理仪式感 + 拖拽投放
// ============================================================

interface RecordPlayerProps {
  jukebox: JukeboxState;
  modelResult: ModelResultData | null;
  /** 唱片机标题（项目名/操作提示） */
  title?: string;
  /** 当前项目模式 */
  mode: JukeboxMode;
}

const MODE_HINT: Record<JukeboxMode, { icon: string; hint: string }> = {
  classify:  { icon: "🖼️", hint: "把图片拖进来哦～" },
  recommend: { icon: "👥", hint: "描述一位用户试试～" },
  retrieve:  { icon: "🎧", hint: "说说想听什么风格～" },
};

export default function RecordPlayer({
  jukebox: _jukeboxProp, // 不再使用 SSE jukebox 状态 — 唱片机只响应拖拽
  modelResult,
  title,
  mode,
}: RecordPlayerProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  // 🔮 完全本地状态：只有拖进来的图片才上唱片机
  const [droppedImage, setDroppedImage] = useState<string | null>(null);
  // 本地动画状态：idle → (drop) → spinning → showing
  type LocalStatus = "idle" | "spinning" | "showing";
  const [localStatus, setLocalStatus] = useState<LocalStatus>("idle");

  const isIdle = localStatus === "idle";
  const isLoading = localStatus === "spinning";
  // 🔮 只在识别完成后才显示图片，避免跟动画叠层
  const isShowingImage = localStatus === "showing";
  const displayImage = droppedImage;

  // 监听拖拽：全局拖拽状态感知
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const onImageDrop = (e: Event) => {
      const detail = (e as CustomEvent).detail as { imageUrl: string };
      if (detail?.imageUrl) {
        setDroppedImage(detail.imageUrl);
        setDragOver(false);
        // 📀 拖入 → 唱片旋转 → 短暂后显示结果
        setLocalStatus("spinning");
        setTimeout(() => {
          setLocalStatus("showing");
        }, 2000); // 2秒旋转动画，V3 替换为真实 CNN 推理时间
      }
    };

    el.addEventListener("image-drop", onImageDrop);
    return () => el.removeEventListener("image-drop", onImageDrop);
  }, [mode]);

  // 全局 mousemove 检测拖拽悬停
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const isDragging = document.body.hasAttribute("data-drag-source");
      if (!isDragging) {
        if (dragOver) setDragOver(false);
        return;
      }
      const el = dropRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const hit =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (hit !== dragOver) setDragOver(hit);
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [dragOver]);

  return (
    <div className="jukebox-container">
      {/* 标题栏 — 女仆围裙风格 */}
      <div className="jukebox-header">
        <span className="jukebox-ribbon">🎀</span>
        <span className="text-xs font-bold tracking-wider">
          {title || "◆ NaNaGi 唱片机 ◆"}
        </span>
        <span className="jukebox-ribbon">🎀</span>
      </div>

      {/* 唱片机主体 — 星尘备忘录风格 + drop zone */}
      <div
        ref={dropRef}
        data-drop-zone="true"
        className={`jukebox-body ${dragOver ? "jukebox-drop-active" : ""}`}
      >
        {/* 唱片机内部 */}
        <div className="jukebox-inner">
          {/* 上图：图像/内容槽 */}
          <div className="jukebox-slot">
            {isIdle && (
              <div className="jukebox-slot-idle">
                <span className="jukebox-slot-icon">
                  {MODE_HINT[mode].icon}
                </span>
                <span className="jukebox-slot-hint">
                  ✨ {MODE_HINT[mode].hint}
                </span>
                <span className="jukebox-slot-subhint">
                  NaNaGi 的识别台 ✦ 拖拽图片到此处
                </span>
              </div>
            )}

            {isLoading && (
              <div className="jukebox-slot-scanning">
                {/* 魔法扫描线 */}
                <div className="magic-scan">
                  <div className="magic-scan-line" />
                  <div className="magic-scan-glow" />
                </div>
                {/* ✨ 粒子 */}
                <div className="magic-particles">
                  <span className="mp mp1">✦</span>
                  <span className="mp mp2">✧</span>
                  <span className="mp mp3">✨</span>
                  <span className="mp mp4">⋆</span>
                  <span className="mp mp5">⭑</span>
                  <span className="mp mp6">✶</span>
                </div>
                <span className="jukebox-slot-scanning-text">
                  🔍 识别中...
                </span>
              </div>
            )}

            {isShowingImage && displayImage && (
              <div className="jukebox-slot-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage}
                  alt="生成图片"
                  className="jukebox-image pixel-border-light"
                />
                <div className="jukebox-tone-arm">
                  <div className="tone-arm-base" />
                  <div className="tone-arm-bar" />
                  <div className="tone-arm-head" />
                </div>
              </div>
            )}

            {isShowingImage && mode !== "classify" && (
              <div className="jukebox-slot-done">
                <span className="text-3xl mb-2">
                  {mode === "recommend" ? "🔗" : "🎵"}
                </span>
                <span className="text-xs tracking-wider opacity-60">
                  ◆ 推理完成 ◆
                </span>
              </div>
            )}

          </div>

          {/* 下图：唱片机底座 */}
          <div className="jukebox-base">
            <div className="jukebox-base-plate">
              <div className="base-groove" />
              <div className="base-groove" />
              <div className="base-groove" />
            </div>
            <div className="jukebox-feet">
              <div className="jukebox-foot" />
              <div className="jukebox-foot" />
              <div className="jukebox-foot" />
              <div className="jukebox-foot" />
            </div>
          </div>
        </div>
      </div>

      {/* 模型结果区 — 围裙+星尘混合 */}
      {(isShowingImage || modelResult) && (
        <div className="model-result-box">
          <div className="model-result-header">
            <span className="text-xs font-bold tracking-wider">
              ◆ 模型识别结果 ◆
            </span>
            <span className="model-result-seal">封缄</span>
          </div>

          {modelResult ? (
            <div className="model-result-content">
              {/* Top-1 大号 */}
              <div className="model-result-top">
                <span className="model-result-label text-lg">
                  {modelResult.topLabel}
                </span>
                <span className="model-result-confidence">
                  {(modelResult.confidence * 100).toFixed(1)}%
                </span>
              </div>

              {/* Top-K 列表 */}
              {modelResult.allPredictions.length > 1 && (
                <div className="model-result-list">
                  {modelResult.allPredictions.slice(1).map((p, i) => (
                    <div key={i} className="model-result-row">
                      <span className="model-result-rank">#{i + 2}</span>
                      <span className="model-result-name">{p.label}</span>
                      <div className="model-result-bar-track">
                        <div
                          className="model-result-bar"
                          style={{
                            width: `${(p.probability * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <span className="model-result-pct">
                        {(p.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="model-result-footer">
                <span className="text-xs opacity-40 tracking-wider">
                  ↑ 以上结果由主人训练的 {modelResult.model} 模型独立输出
                </span>
                <span className="text-xs opacity-30 tracking-wider">
                  NaNaGi 不会看图片，结果来自模型真实推理
                </span>
              </div>
            </div>
          ) : (
            <div className="model-result-empty">
              <span className="text-xs opacity-50 tracking-wider">
                ◆ 等待推理结果...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
