import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Inventory Ops",
  description: "AI-assisted inventory operations for US → Taiwan sports card dropshipping.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen bg-zinc-950">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center border-b border-zinc-800 bg-zinc-950 px-6">
              <div className="text-sm text-zinc-400">Inventory Ops · US → Taiwan</div>
            </header>
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
