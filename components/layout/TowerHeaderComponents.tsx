'use client';

import { UserButton } from "@clerk/nextjs"; // Importa UserButton
import Link from "next/link";
import { usePathname } from "next/navigation";
// ELIMINADO: useRouter, Button
import { cn } from "@/lib/utils"; // NUEVO: Importa la utilidad cn

export default function TowerHeaderComponents() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/trips", label: "Viajes" },
    { href: "/vehicles", label: "Vehículos" },
    { href: `${process.env.NEXT_PUBLIC_PAYMENTS_APP_URL}/disbursements` || "#", label: "Liquidaciones" }, // Usar NEXT_PUBLIC_PAYMENTS_APP_URL
  ];

  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors",
            pathname === link.href // Destacar el link activo
              ? "text-yellow-500 font-bold underline underline-offset-4" // Estilo para link activo
              : "text-slate-300 hover:text-white" // Estilo para links inactivos
          )}
          // Para enlaces externos, es buena práctica abrir en nueva pestaña
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {link.label}
        </Link>
      ))}
      <UserButton />
    </>
  );
}
