import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Олимпиадный тренажёр",
  description: "Подготовка к олимпиадам по математике",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
