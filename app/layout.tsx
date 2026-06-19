import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Mall - 微型电商",
  description: "Mini Mall 微型电商系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
