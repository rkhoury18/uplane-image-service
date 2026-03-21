import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from '@/components/ui/sonner';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Image Transformation Service",
  description: "Remove backgrounds, flip horizontally, and get instant shareable URLs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
