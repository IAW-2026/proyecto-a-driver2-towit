'use client';

import { UserAvatar, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAccountDetailsModal } from "@/components/providers/AccountDetailsModalProvider";

export default function AdminHeader() {
  const { user, isLoaded } = useUser();
  const { openModal: openAccountDetailsModal } = useAccountDetailsModal();

  if (!isLoaded || !user) {
    return (
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Admin Dashboard</span>
          </div>
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* El título siempre apunta al dashboard de admin */}
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Admin Dashboard</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <button
            onClick={openAccountDetailsModal}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between space-x-2 cursor-pointer"
          >
            <span>Mi Cuenta</span>
            <UserAvatar />
          </button>
        </nav>
      </div>
    </header>
  );
}
