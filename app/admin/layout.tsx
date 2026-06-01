import React from 'react';
import AppFooter from "@/components/layout/AppFooter";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-900/50 text-slate-100 flex flex-col">
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
