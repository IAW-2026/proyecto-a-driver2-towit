import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import AppHeaderClientTower from "./AppHeaderClientTower";
import AppHeaderClientGuest from "./AppHeaderClientGuest";
import AppHeaderMobileMenu from "./AppHeaderMobileMenu";

export default async function AppHeader() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-yellow-500">Tow<span className="text-white">It</span></span>
            <span className="bg-yellow-500/10 text-yellow-500 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-500/20">Towers</span>
          </Link>
        </div>

        {/* Navegación para escritorio */}
        <nav className="hidden md:flex items-center gap-4">
          {isSignedIn ? <AppHeaderClientTower /> : <AppHeaderClientGuest />}
        </nav>

        {/* Menú móvil */}
        <AppHeaderMobileMenu isSignedIn={isSignedIn} />
      </div>
    </header>
  );
}
