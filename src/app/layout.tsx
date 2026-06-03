import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { ChatProvider } from "@/contexts/ChatContext";
import PageShell from "@/components/PageShell";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NaNaGi | 南志锦 AI Portfolio",
  description: "南志锦的专属AI女仆 · 从模型到产品的完整闭环",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ChatProvider>
          <PageShell>{children}</PageShell>
        </ChatProvider>
        <div className="scanlines" aria-hidden="true" />
      </body>
    </html>
  );
}
