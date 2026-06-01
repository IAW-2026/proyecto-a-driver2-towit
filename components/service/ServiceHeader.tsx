import Link from "next/link";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";

export default function ServiceHeader() {
  return (
    <header className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-slate-950/70 to-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-2xl font-black tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors">
            Tow<span className="text-white">It</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white hover:bg-slate-800/50">Dashboard</Button>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <UserButton /> {/* Botón de usuario de Clerk */}
        </div>
      </div>
    </header>
  );
}
