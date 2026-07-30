import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unified Org Workspace — Ticketing + PR/Audit Console",
  description: "Secure, multi-tenant workspace with shared JWT identity, BOLA-proof tenant isolation, and append-only audit logging.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
