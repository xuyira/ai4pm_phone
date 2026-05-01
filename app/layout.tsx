import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PrototypeStoreProvider } from "@/components/prototype-store";
import { ToastViewport } from "@/components/toast";

export const metadata: Metadata = {
  title: "产品上岸 AI 助手",
  description: "面向产品经理求职场景的移动端 AI 助手原型"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <PrototypeStoreProvider>
          <div className="app-shell">
            <div className="phone-frame">
              <main className="page-body">{children}</main>
              <BottomNav />
            </div>
          </div>
          <ToastViewport />
        </PrototypeStoreProvider>
      </body>
    </html>
  );
}
