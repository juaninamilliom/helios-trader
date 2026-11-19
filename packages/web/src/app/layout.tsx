import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Helios — A little clarity for your money",
  description: "Understand your money. Protect today. Make room for tomorrow.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
