// ============================================================
// NaNaGi Agent 工具 — 统一入口
// import 所有工具文件 → 触发 registerTool() → 注册到 registry
// ============================================================

// 新增工具
import "./get-time";
import "./get-weather";
import "./get-project-info";

// 从 route.ts 提取重构
import "./search-memory";
import "./save-memory";
import "./generate-image";
import "./navigate-project";
import "./gnn-recommend";
import "./cnnmusic-search";
