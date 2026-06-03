"use client";

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AgentWidget from "./AgentWidget";
import MemoryPanel from "./MemoryPanel";

export default function PageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <MemoryPanel />
      {children}
      {!isHome && <AgentWidget />}
    </>
  );
}
