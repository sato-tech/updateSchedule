import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Update Schedule",
  description: "AiNA MyPage 掲載スケジュールを Google カレンダーに同期",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
