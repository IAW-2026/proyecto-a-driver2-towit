"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Asumiendo que lucide-react está instalado
import { cn } from "@/lib/utils"; // Importa la utilidad cn
import { UserButton } from "@clerk/nextjs";

export default function MobileTowerHeaderComponents() {
    const pathname = usePathname();

    const navLinks = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/trips", label: "Viajes" },
        { href: "/vehicles", label: "Vehículos" },
        { href: `${process.env.NEXT_PUBLIC_PAYMENTS_APP_URL}`, label: "Liquidaciones" },
    ];

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Menú de navegación</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-white p-2" align="end">
                    {navLinks.map((link) => (
                        <DropdownMenuItem key={link.href} className="p-0">
                            <Link
                                href={link.href}
                                className={cn(
                                    "block w-full text-left py-2 px-3 rounded-md text-sm font-medium transition-colors hover:bg-slate-700 hover:text-white",
                                    pathname === link.href ? "bg-yellow-600 text-slate-950 font-bold" : "text-slate-300"
                                )}
                            >
                                {link.label}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <UserButton />
        </>
    );
}
