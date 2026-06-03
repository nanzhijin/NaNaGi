"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

// Floating FAB + slide-out chat panel for project pages
export default function AgentWidget() {
  const { messages, streaming, sendMessage } = useChat();
  const [open, setOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  // Flash indicator when new agent message arrives while panel is closed
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      const last = messages[messages.length - 1];
      if (last?.role === "agent") setHasNewMessage(true);
    }
    prevCountRef.current = messages.length;
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setHasNewMessage(false);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 pixel-btn-accent w-14 h-14 flex items-center justify-center text-xl ${
          hasNewMessage ? "animate-pulse" : ""
        }`}
        title="打开 NaNaGi 对话"
      >
        {open ? "✕" : "◆"}
      </button>

      {/* Slide-out Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <div className="rpg-dialog flex flex-col" style={{ maxHeight: "70vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-border">
              <span className="text-xs font-bold tracking-wider">
                ◆ NaNaGi
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-2 max-h-80">
              {messages.length === 0 && (
                <p className="text-ink-muted text-xs">
                  Agent 就绪。问任何问题吧。
                </p>
              )}
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  imageUrl={msg.imageUrl}
                  isStreaming={
                    streaming &&
                    i === messages.length - 1 &&
                    msg.role === "agent"
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              disabled={streaming}
              placeholder="输入消息..."
            />
          </div>
        </div>
      )}
    </>
  );
}
