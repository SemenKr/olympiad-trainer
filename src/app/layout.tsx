import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.scss";

const onest = Onest({
  subsets: ["cyrillic", "latin"],
  variable: "--font-onest",
  weight: ["400", "600", "700"],
});

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
    <html className={onest.variable} lang="ru">
      <body>{children}</body>
    </html>
  );
}
