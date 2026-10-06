import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "BulkMart — Bulk-bought, better priced",
  description:
    "BulkMart buys products in bulk directly from suppliers and passes the savings to you. Shop wholesale-priced electronics, home goods, groceries and more.",
  keywords: ["bulk store", "wholesale", "ecommerce", "online shopping", "discount products"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
