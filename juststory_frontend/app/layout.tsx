import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import StoreProvider from "./StoreProvider";

const butlerFont = localFont({
  src: "./fonts/Butler.woff",
  variable: "--font-butler",
  weight: "100 900",
});

const monomakh = localFont({
  src: "./fonts/Dusha V5 Regular.ttf",
  variable: "--font-monomakh",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JustStory - Интерактивные игры-сторителеры с AI",
  description: "JustStory - платформа для создания и прохождения интерактивных текстовых приключений с использованием искусственного интеллекта GigaChat. Создавайте уникальные истории и погружайтесь в захватывающие приключения.",
  keywords: "интерактивные игры, текстовые приключения, AI игры, GigaChat, сторителер, игры с искусственным интеллектом",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  openGraph: {
    title: "JustStory - Интерактивные игры-сторителеры с AI",
    description: "Создавайте и проходите уникальные текстовые приключения с помощью искусственного интеллекта",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <StoreProvider>
        <body
          className={`${butlerFont.variable} ${monomakh.variable} antialiased`}
        >
          {children ? children : null}
        </body>
      </StoreProvider>
    </html>
  );
}
