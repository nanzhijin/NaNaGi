"use client";

import { useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import type { JukeboxMode } from "@/lib/types";

interface ProjectPageClientProps {
  slug: string;
  /** 唱片机模式 */
  mode: JukeboxMode;
}

/** Client component: registers project context for Agent + enables jukebox mode */
export default function ProjectPageClient({ slug, mode }: ProjectPageClientProps) {
  const { setProjectSlug, clearModelResult } = useChat();

  useEffect(() => {
    setProjectSlug(slug);
    // 进入新展厅时清空上一轮的推理结果
    clearModelResult();
    return () => {
      setProjectSlug(null);
    };
  }, [slug, setProjectSlug, clearModelResult]);

  // Register mode for the page (used by chat API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__nanagiProject = slug;
      (window as unknown as Record<string, unknown>).__nanagiMode = mode;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as unknown as Record<string, unknown>).__nanagiProject;
        delete (window as unknown as Record<string, unknown>).__nanagiMode;
      }
    };
  }, [slug, mode]);

  return null;
}
