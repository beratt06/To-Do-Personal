import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "FocusFlow — Akıllı çalışma asistanı", description: "Çalışma alanlarını, görevlerini ve hedeflerini tek yerde yönet." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="tr" suppressHydrationWarning><body>{children}</body></html>; }
