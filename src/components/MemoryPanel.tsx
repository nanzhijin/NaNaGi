"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@/contexts/ChatContext";

// ============================================================
// NaNaGi 记忆面板 — 左侧滑出，像素风卡片，只读展示
// 自动监听 memoryVersion 刷新
// ============================================================

interface MemoryBrief {
  slug: string;
  meta: {
    name: string;
    description: string;
    type: string;
    tags?: string[];
    visitorId?: string;
    projectSlug?: string;
    createdAt?: string;
  };
  updatedAt: string;
}

interface MemoryDetail {
  slug: string;
  meta: MemoryBrief["meta"];
  content: string;
  updatedAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  user: "👤",
  project: "📁",
  impression: "💭",
  feedback: "📝",
};

const TYPE_LABELS: Record<string, string> = {
  user: "访客档案",
  project: "项目记忆",
  impression: "印象笔记",
  feedback: "反馈记录",
};

export default function MemoryPanel() {
  const { isAuthenticated, userRole, memoryVersion } = useChat();
  const [open, setOpen] = useState(false);
  const [memories, setMemories] = useState<MemoryBrief[]>([]);
  const [selected, setSelected] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载记忆列表
  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (err) {
      console.error("[MemoryPanel] 加载失败:", err);
    }
  }, []);

  // 面板打开时 + memoryVersion 变化时自动刷新
  useEffect(() => {
    if (open && isAuthenticated) loadMemories();
  }, [open, isAuthenticated, memoryVersion, loadMemories]);

  // 打开详情
  const openDetail = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/${slug}`);
      if (res.ok) setSelected(await res.json());
    } catch (err) {
      console.error("[MemoryPanel] 详情失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除（仅管理员）
  const handleDelete = useCallback(
    async (slug: string) => {
      if (userRole !== "admin") return;
      if (!confirm("确定删除这条记忆吗？")) return;
      try {
        const res = await fetch(`/api/memory/${slug}`, { method: "DELETE" });
        if (res.ok) {
          setMemories((prev) => prev.filter((m) => m.slug !== slug));
          if (selected?.slug === slug) setSelected(null);
        }
      } catch (err) {
        console.error("[MemoryPanel] 删除失败:", err);
      }
    },
    [userRole, selected]
  );

  if (!isAuthenticated) return null;

  return (
    <>
      {/* 切换按钮 — 左侧屏幕边缘 */}
      <button
        onClick={() => setOpen(!open)}
        className={`memory-toggle ${open ? "memory-toggle-open" : ""}`}
        title={open ? "收起记忆库" : "打开记忆库"}
      >
        <span className="memory-toggle-icon">{open ? "◂" : "▸"}</span>
        <span className="memory-toggle-label">
          {open ? "" : "记忆"}
        </span>
      </button>

      {/* 滑出面板 + 遮罩 */}
      {open && (
        <div className="memory-backdrop" onClick={() => setOpen(false)} />
      )}

      <div className={`memory-panel ${open ? "memory-panel-open" : ""}`}>
        <div className="memory-panel-header">
          <span className="text-xs font-bold tracking-wider">
            ◆ NaNaGi 记忆库 ◆
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-50">
              {memories.length} 条记忆
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 卡片网格 */}
        <div className="memory-grid">
          {memories.length === 0 && (
            <div className="memory-empty">
              <span className="text-2xl opacity-30 mb-2">📭</span>
              <span className="text-xs opacity-50 tracking-wider">
                暂无记忆，聊起来就有了 ✨
              </span>
            </div>
          )}

          {memories.map((m) => (
            <div
              key={m.slug}
              className={`memory-card ${
                selected?.slug === m.slug ? "memory-card-active" : ""
              }`}
              onClick={() => openDetail(m.slug)}
            >
              <div className="memory-card-type">
                {TYPE_ICONS[m.meta.type] || "📄"}
              </div>
              <div className="memory-card-body">
                <div className="memory-card-title">{m.meta.description}</div>
                <div className="memory-card-meta">
                  <span className="memory-card-badge">
                    {TYPE_LABELS[m.meta.type] || m.meta.type}
                  </span>
                  <span className="memory-card-date">
                    {m.updatedAt
                      ? new Date(m.updatedAt).toLocaleDateString("zh-CN")
                      : ""}
                  </span>
                </div>
              </div>
              {userRole === "admin" && (
                <button
                  className="memory-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(m.slug);
                  }}
                  title="删除"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 详情弹窗 */}
        {selected && (
          <div
            className="memory-detail-overlay"
            onClick={() => setSelected(null)}
          >
            <div
              className="memory-detail rpg-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="text-center py-8">
                  <span className="animate-pulse text-ink-muted text-sm">
                    ◆ 加载中...
                  </span>
                </div>
              ) : (
                <>
                  <div className="memory-detail-header">
                    <div>
                      <span className="memory-detail-type">
                        {TYPE_ICONS[selected.meta.type]}{" "}
                        {TYPE_LABELS[selected.meta.type]}
                      </span>
                      <h3 className="memory-detail-title">
                        {selected.meta.description}
                      </h3>
                    </div>
                    <div className="memory-detail-actions">
                      {userRole === "admin" && (
                        <button
                          className="pixel-btn text-xs"
                          onClick={() => handleDelete(selected.slug)}
                          style={{
                            background: "var(--accent)",
                            borderColor: "var(--accent)",
                          }}
                        >
                          🗑 删除
                        </button>
                      )}
                      <button
                        className="pixel-btn text-xs"
                        onClick={() => setSelected(null)}
                      >
                        ✕ 关闭
                      </button>
                    </div>
                  </div>

                  <div className="memory-detail-meta">
                    <span>
                      slug: <code>{selected.slug}</code>
                    </span>
                    {selected.meta.tags?.length && (
                      <span>标签: {selected.meta.tags.join(", ")}</span>
                    )}
                    <span>
                      更新:{" "}
                      {new Date(selected.updatedAt).toLocaleString("zh-CN")}
                    </span>
                  </div>

                  <div className="memory-detail-content">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selected.content}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
