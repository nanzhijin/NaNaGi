"use client";

import { useChat } from "@/contexts/ChatContext";
import RecordPlayer from "@/components/RecordPlayer";
import type { Project } from "@/lib/projects";
import type { JukeboxMode } from "@/lib/types";

interface ProjectExhibitionProps {
  project: Project;
  mode: JukeboxMode;
}

/** Client component: renders the RecordPlayer exhibition area for a project */
export default function ProjectExhibition({
  project,
  mode,
}: ProjectExhibitionProps) {
  const { jukebox, modelResult } = useChat();

  return (
    <div className="space-y-4">
      {/* 唱片机 */}
      <RecordPlayer
        jukebox={jukebox}
        modelResult={modelResult}
        title={`${project.emoji} ${project.title}`}
        mode={mode}
      />

      {/* 技术说明 — 星尘备忘录风格 */}
      <div className="pixel-border-light bg-cream-card p-4">
        <div className="text-xs font-bold tracking-wider mb-2 opacity-60">
          ◆ 关于这个展厅
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          {project.short}
        </p>
        <p className="text-xs text-ink-muted leading-relaxed mt-2">
          NaNaGi 负责调度，模型负责推理。聊天区的话来自 DeepSeek，
          唱片机的识别结果来自主人训练的 {project.title} 模型。两个信息源独立，互为印证。
        </p>
      </div>
    </div>
  );
}
