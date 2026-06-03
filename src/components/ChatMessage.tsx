"use client";

import Link from "next/link";
import { useMemo } from "react";
import DraggableImage from "./DraggableImage";

interface ChatMessageProps {
  role: "agent" | "user";
  content: string;
  isStreaming?: boolean;
  imageUrl?: string; // 🔮 混元生成的图片
}

// Parse <a href="...">text</a> from Agent messages into segments
interface TextSegment {
  type: "text";
  text: string;
}
interface LinkSegment {
  type: "link";
  href: string;
  text: string;
}
type Segment = TextSegment | LinkSegment;

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  // Match <a href="URL">text</a> — handle both single and double quotes on href
  const linkRegex = /<a\s+href=["']([^"']+)["']\s*>([^<]*)<\/a>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    // Text before the link
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: content.slice(lastIndex, match.index),
      });
    }
    // The link
    segments.push({
      type: "link",
      href: match[1],
      text: match[2] || match[1],
    });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      text: content.slice(lastIndex),
    });
  }

  return segments.length > 0
    ? segments
    : [{ type: "text", text: content }];
}

export default function ChatMessage({
  role,
  content,
  isStreaming = false,
  imageUrl,
}: ChatMessageProps) {
  const isAgent = role === "agent";

  // Only parse Agent messages for links
  const segments = useMemo(
    () => (isAgent ? parseContent(content) : null),
    [content, isAgent]
  );

  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] ${
          isAgent ? "msg-agent" : "msg-user"
        } ${isStreaming ? "cursor-blink" : ""}`}
      >
        <div className="text-xs font-bold mb-1 opacity-50 tracking-wider uppercase">
          {isAgent ? "◆ NaNaGi" : "◆ 面试官"}
        </div>

        <div className="chat-content text-sm leading-relaxed break-words">
          {isAgent && segments ? (
            segments.map((seg, i) =>
              seg.type === "link" ? (
                <Link
                  key={i}
                  href={seg.href}
                  className="inline-block pixel-btn-accent text-xs my-1 no-underline"
                >
                  {seg.text} ▸
                </Link>
              ) : (
                <span key={i} className="whitespace-pre-wrap">
                  {seg.text}
                </span>
              )
            )
          ) : (
            <span className="whitespace-pre-wrap">{content}</span>
          )}

          {/* 🔮 混元生图 — 可拖拽图片 */}
          {imageUrl && (
            <div className="mt-2">
              <DraggableImage src={imageUrl} alt="混元生图" />
            </div>
          )}
        </div>

        {isStreaming && content === "" && (
          <span className="inline-block w-2 h-4 bg-accent animate-pulse" />
        )}
      </div>
    </div>
  );
}
