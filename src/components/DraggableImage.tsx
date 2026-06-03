"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

// ============================================================
// 可拖拽图片 — fixed 克隆体跟随鼠标，突破容器裁剪
// 聊天框内松手 → 弹回原位 / 唱片机上松手 → 触发投放
// ============================================================

interface DraggableImageProps {
  src: string;
  alt?: string;
}

export default function DraggableImage({ src, alt = "生成图片" }: DraggableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [clonePos, setClonePos] = useState({ x: 0, y: 0 });
  const [cloneSize, setCloneSize] = useState({ w: 200, h: 150 });
  const originRef = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) return;
      e.preventDefault();

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      originRef.current = { x: rect.left, y: rect.top };
      setCloneSize({ w: rect.width, h: rect.height });
      setClonePos({ x: e.clientX - rect.width / 2, y: e.clientY - rect.height / 2 });

      document.body.setAttribute("data-drag-source", src);
      setDragging(true);
    },
    [src]
  );

  // 全局 mousemove / mouseup
  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setClonePos({
        x: e.clientX - cloneSize.w / 2,
        y: e.clientY - cloneSize.h / 2,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      setDragging(false);
      document.body.removeAttribute("data-drag-source");

      // 检查鼠标下方是否有 drop-zone
      const dropZone = document.elementFromPoint(e.clientX, e.clientY);
      const hitJukebox = dropZone?.closest("[data-drop-zone]");

      if (hitJukebox) {
        hitJukebox.dispatchEvent(
          new CustomEvent("image-drop", {
            detail: { imageUrl: src },
            bubbles: true,
          })
        );
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, cloneSize.w, cloneSize.h, src]);

  return (
    <>
      {/* 原位元素（拖拽时半透明） */}
      <div
        ref={containerRef}
        className={`draggable-image ${dragging ? "dragging-ghost" : ""}`}
        onMouseDown={onMouseDown}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="draggable-image-img"
          draggable={false}
        />

        <div className="draggable-image-toolbar">
          <a
            href={src}
            download={`nanagi-${Date.now()}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="draggable-image-btn"
            title="下载图片"
          >
            💾
          </a>
          <span className="draggable-image-hint text-xs opacity-50">
            拖拽到唱片机
          </span>
        </div>
      </div>

      {/* fixed 克隆体 — 突破所有容器裁剪，紧跟鼠标 */}
      {dragging &&
        createPortal(
          <div
            className="draggable-clone"
            style={{
              position: "fixed",
              left: clonePos.x,
              top: clonePos.y,
              width: cloneSize.w,
              height: "auto",
              zIndex: 99999,
              pointerEvents: "none",
              filter: "drop-shadow(0 8px 24px rgba(124, 111, 160, 0.5))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              style={{
                width: "100%",
                height: "auto",
                border: "3px solid var(--star-spark, #C4B8F0)",
                borderRadius: 0,
                background: "#FFFDF7",
              }}
              draggable={false}
            />
          </div>,
          document.body
        )}
    </>
  );
}
