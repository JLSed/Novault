import type { Metadata } from "next";
import { DM_Sans, Onest } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const onest = Onest({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: "NoVault",
  description:
    "A secure cloud storage solution with zero-knowledge encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${onest.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
