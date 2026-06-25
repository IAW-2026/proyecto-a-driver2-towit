"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Asumiendo que lucide-react está instalado

export default function MobileGuestHeaderComponents() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menú para invitados</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-900 border-slate-700 text-white p-2" align="end">
        <DropdownMenuItem className="p-0"> {/* Eliminar padding predeterminado */}
          <SignInButton mode="modal" forceRedirectUrl={"/dashboard"} signUpForceRedirectUrl={"/dashboard"}>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-700">
              Iniciar Sesión
            </Button>
          </SignInButton>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0"> {/* Eliminar padding predeterminado */}
          <SignUpButton mode="modal" unsafeMetadata={{role: "tower"}} forceRedirectUrl="/dashboard" signInForceRedirectUrl={"/dashboard"}>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-700">
              Registrarse
            </Button>
          </SignUpButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
