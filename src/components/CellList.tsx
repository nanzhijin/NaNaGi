"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";

interface CellInfo {
  cellId: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  lastMessageAt: string;
}

interface CellListProps {
  cells: CellInfo[];
  currentCellId: string | null;
  onSelect: (cellId: string) => void;
  onNew: () => void;
  onDelete: (cellId: string) => void;
  onRename: (cellId: string, title: string) => void;
  onPin: (cellId: string, pinned: boolean) => void;
}

export default function CellList({ cells, currentCellId, onSelect, onNew, onDelete, onRename, onPin }: CellListProps) {
  const { openPanel, setOpenPanel } = useChat();
  const open = openPanel === "cell";
  const [menuCellId, setMenuCellId] = useState<string | null>(null);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuCellId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sorted = [...cells].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const openRename = (cellId: string) => {
    setMenuCellId(null);
    const cell = cells.find((c) => c.cellId === cellId);
    setEditTitle(cell?.title || "");
    setEditingCellId(cellId);
  };

  const submitRename = () => {
    if (editingCellId && editTitle.trim()) onRename(editingCellId, editTitle.trim());
    setEditingCellId(null);
  };

  return (
    <>
      {/* 左侧竖排切换按钮 */}
      <button
        onClick={() => setOpenPanel(open ? null : "cell")}
        className={`cell-toggle ${open ? "cell-toggle-open" : ""}`}
        title={open ? "收起对话列表" : "打开对话列表"}
      >
        <span className="cell-toggle-icon">{open ? "◂" : "▸"}</span>
        <span className="cell-toggle-label">{open ? "" : "对话"}</span>
      </button>

      {/* 遮罩 */}
      {open && <div className="cell-backdrop" onClick={() => setOpenPanel(null)} />}

      {/* 滑出面板 — 跟 MemoryPanel 相同设计 */}
      <div className={`cell-panel ${open ? "cell-panel-open" : ""}`}>
        <div className="cell-panel-header">
          <span>📋 对话列表</span>
          <button onClick={() => setOpenPanel(null)} className="text-sm font-bold hover:text-accent">✕</button>
        </div>

        <button onClick={() => { onNew(); }} className="w-full pixel-btn py-1.5 text-xs font-bold tracking-wider mb-2">
          ＋ 新对话
        </button>

        <div className="cell-panel-list">
          {sorted.length === 0 && <p className="text-xs text-ink-muted text-center py-6">暂无对话</p>}

          {sorted.map((cell) => (
            <div key={cell.cellId} className="relative mb-1">
              {editingCellId === cell.cellId ? (
                <div className="px-2 py-1.5 border-2 border-accent bg-cream-card">
                  <input
                    type="text" value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => e.key === "Enter" && submitRename()}
                    className="w-full px-1 py-0.5 text-xs font-bold bg-cream-hover border-2 border-border"
                    autoFocus
                  />
                  <div className="flex gap-1 mt-1.5">
                    <button onMouseDown={(e) => { e.preventDefault(); submitRename(); }} className="flex-1 text-xs py-1 bg-accent text-white font-bold">✓ 确认</button>
                    <button onMouseDown={(e) => { e.preventDefault(); setEditingCellId(null); }} className="flex-1 text-xs py-1 border-2 border-border font-bold">✗ 取消</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { onSelect(cell.cellId); }}
                  className={`w-full text-left px-2 py-1.5 border-2 text-xs transition-colors ${
                    cell.cellId === currentCellId ? "border-accent bg-cream-hover" : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold tracking-wider truncate flex-1">{cell.pinned ? "📌 " : ""}{cell.title}</span>
                    <span onClick={(e) => { e.stopPropagation(); setMenuCellId(menuCellId === cell.cellId ? null : cell.cellId); }}
                      className="font-bold text-base leading-none px-1 hover:text-accent select-none cursor-pointer">···</span>
                  </div>
                  <div className="text-ink-muted mt-0.5">{formatDate(cell.lastMessageAt)}</div>
                </button>
              )}

              {menuCellId === cell.cellId && (
                <div ref={menuRef} className="absolute right-2 top-10 z-50 py-0.5 w-32" style={{ background: "#faf3e8", border: "2px solid #d4a574", boxShadow: "2px 2px 0 #d4a574" }}>
                  <button onClick={() => { setMenuCellId(null); onPin(cell.cellId, !cell.pinned); }} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-cream-hover tracking-wider">
                    📌 {cell.pinned ? "取消置顶" : "置顶"}
                  </button>
                  <button onClick={() => openRename(cell.cellId)} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-cream-hover tracking-wider">✏️ 重命名</button>
                  <button onClick={() => { setMenuCellId(null); onDelete(cell.cellId); }} className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-cream-hover text-accent tracking-wider">🗑 删除</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (now.getTime() - d.getTime() < 24 * 60 * 60 * 1000) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
