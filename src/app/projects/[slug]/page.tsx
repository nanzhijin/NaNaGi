import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import Link from "next/link";
import type { JukeboxMode } from "@/lib/types";
import ProjectPageClient from "./ProjectPageClient";
import ProjectExhibition from "./ProjectExhibition";

// Map project slug to jukebox mode
const slugToMode: Record<string, JukeboxMode> = {
  "fruit-cnn": "classify",
  "cnn-music": "retrieve",
  gnn: "recommend",
};

export function generateStaticParams() {
  return Object.keys(projects).map((slug) => ({ slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects[slug];
  if (!project) notFound();

  const mode = slugToMode[slug] || "classify";

  return (
    <main className="min-h-screen py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 pixel-btn text-sm mb-6"
        >
          ← 回到对话
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 左侧：唱片机展区 (占3栏) */}
          <div className="lg:col-span-3">
            <ProjectExhibition project={project} mode={mode} />
          </div>

          {/* 右侧：项目信息 (占2栏) */}
          <div className="lg:col-span-2 space-y-4">
            {/* 项目标题卡 — 女仆围裙风格 */}
            <div className="apron-border apron-ribbon-corner relative p-5">
              <h1 className="text-xl font-bold tracking-wider mb-2">
                {project.emoji} {project.title}
              </h1>
              <p className="text-sm text-ink-light leading-relaxed">
                {project.description}
              </p>

              {/* Tech tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs font-bold tracking-wider border-2 border-border bg-cream-hover"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 指标卡 — 女仆围裙风格 */}
            <div className="grid grid-cols-2 gap-3">
              {project.metrics.map((m) => (
                <div
                  key={m.label}
                  className="pixel-border-light bg-cream-card p-4 text-center"
                >
                  <div className="text-2xl font-bold text-accent">
                    {m.value}
                  </div>
                  <div className="text-xs text-ink-muted mt-1 tracking-wider">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* 操作提示 — 像素下午茶风格 */}
            <div className="tea-bubble-agent">
              <p className="text-xs text-ink-light leading-relaxed">
                💡 <strong>试试对 NaNaGi 说：</strong>
              </p>
              <ul className="text-xs text-ink-muted mt-2 space-y-1">
                {mode === "classify" && (
                  <>
                    <li>• &quot;给我画一个新鲜的西瓜&quot;</li>
                    <li>• &quot;我想看看苹果的识别效果&quot;</li>
                    <li>• &quot;画一个榴莲，看看CNN认不认得&quot;</li>
                  </>
                )}
                {mode === "recommend" && (
                  <>
                    <li>• &quot;模拟一个喜欢运动的用户&quot;</li>
                    <li>• &quot;换一个喜欢数码产品的用户画像&quot;</li>
                    <li>• &quot;帮我分析推荐结果为什么是这些&quot;</li>
                  </>
                )}
                {mode === "retrieve" && (
                  <>
                    <li>• &quot;帮我搜一下爵士风格的播客&quot;</li>
                    <li>• &quot;古典钢琴有什么推荐&quot;</li>
                    <li>• &quot;对比一下CNN和NLP的检索结果&quot;</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 客户端：注册项目上下文 */}
      <ProjectPageClient slug={slug} mode={mode} />
    </main>
  );
}
