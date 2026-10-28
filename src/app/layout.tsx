import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Link Shield",
  description: "Vérifiez un lien avant de cliquer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}